;; Constants for error codes
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-UNAUTHORIZED (err u403))
(define-constant ERR-INVALID-HEIGHT (err u500))
(define-constant ERR-ALREADY-DELETED (err u401))

;; Define the data structure for our messages
(define-map messages
  { id: uint }
  {
    sender: principal,
    message: (string-utf8 1024),
    unlock-height: uint,
    category: (optional (string-utf8 64)),
    recipient: (optional principal),
    is-deleted: bool,
    created-at: uint,
    last-modified: uint
  }
)

;; Keep track of user statistics
(define-map user-stats 
  { user: principal }
  {
    messages-sent: uint,
    messages-received: uint,
    last-activity: uint
  }
)

;; Keep track of the total number of messages
(define-data-var message-count uint u0)

;; Function to store a new message
(define-public (store-message 
    (message (string-utf8 1024)) 
    (unlock-height uint)
    (category (optional (string-utf8 64)))
    (recipient (optional principal)))
  (let
    ((new-id (+ (var-get message-count) u1)))
    (asserts! (< unlock-height u9999999999) ERR-INVALID-HEIGHT)
    (map-set messages
      { id: new-id }
      {
        sender: tx-sender,
        message: message,
        unlock-height: unlock-height,
        category: category,
        recipient: recipient,
        is-deleted: false,
        created-at: block-height,
        last-modified: block-height
      }
    )
    ;; Update sender stats
    (update-user-stats tx-sender true false)
    ;; Update recipient stats if specified
    (match recipient 
      recipient-principal (update-user-stats recipient-principal false true)
      true
    )
    (var-set message-count new-id)
    (ok new-id)
  )
)

;; Function to update user statistics
(define-private (update-user-stats (user principal) (is-sender bool) (is-recipient bool))
  (let
    ((current-stats (default-to 
      { messages-sent: u0, messages-received: u0, last-activity: block-height }
      (map-get? user-stats { user: user }))))
    (map-set user-stats
      { user: user }
      {
        messages-sent: (if is-sender 
          (+ (get messages-sent current-stats) u1)
          (get messages-sent current-stats)),
        messages-received: (if is-recipient
          (+ (get messages-received current-stats) u1)
          (get messages-received current-stats)),
        last-activity: block-height
      }
    )
  )
)

;; Function to retrieve a message
(define-read-only (get-message (id uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) ERR-NOT-FOUND)))
    (asserts! (not (get is-deleted msg)) ERR-ALREADY-DELETED)
    (asserts! (>= block-height (get unlock-height msg)) ERR-UNAUTHORIZED)
    (asserts! (or 
      (is-eq tx-sender (get sender msg))
      (match (get recipient msg)
        recipient (is-eq tx-sender recipient)
        true)
    ) ERR-UNAUTHORIZED)
    (ok msg)
  )
)

;; Function to soft delete a message
(define-public (delete-message (id uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get sender msg)) ERR-UNAUTHORIZED)
    (map-set messages
      { id: id }
      (merge msg { 
        is-deleted: true,
        last-modified: block-height
      })
    )
    (ok true)
  )
)

;; Function to update message unlock height
(define-public (update-unlock-height (id uint) (new-unlock-height uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get sender msg)) ERR-UNAUTHORIZED)
    (asserts! (not (get is-deleted msg)) ERR-ALREADY-DELETED)
    (asserts! (> new-unlock-height block-height) ERR-INVALID-HEIGHT)
    (map-set messages
      { id: id }
      (merge msg { 
        unlock-height: new-unlock-height,
        last-modified: block-height
      })
    )
    (ok true)
  )
)

;; Function to get message metadata
(define-read-only (get-message-info (id uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) ERR-NOT-FOUND)))
    (ok {
      sender: (get sender msg),
      recipient: (get recipient msg),
      unlock-height: (get unlock-height msg),
      category: (get category msg),
      created-at: (get created-at msg),
      is-deleted: (get is-deleted msg),
      last-modified: (get last-modified msg)
    })
  )
)

;; Function to get user statistics
(define-read-only (get-user-stats (user principal))
  (ok (default-to
    { messages-sent: u0, messages-received: u0, last-activity: u0 }
    (map-get? user-stats { user: user })))
)

;; Function to get total message count
(define-read-only (get-message-count)
  (ok (var-get message-count))
)