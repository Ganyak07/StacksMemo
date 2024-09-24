;;Tittle:StackMemo Smart Contract
;; v2.0

;;Define the data structure for the messages
(define-map messages
  { id: uint }
  {
    sender: principal,
    recipient: (optional principal),
    message: (string-utf8 1024),
    unlock-height: uint,
    expires-at: uint,
    is-encrypted: bool
  }
)

;; Keep track of the total number of messages
(define-data-var message-count uint u0)

;; Function to store a new message
(define-public (store-message (message (string-utf8 1024)) (unlock-height uint) (expires-at uint) (is-encrypted bool) (recipient (optional principal)))
  (let
    ((new-id (+ (var-get message-count) u1)))
    (asserts! (< unlock-height u9999999999) (err u500)) ;; Prevent unreasonably high unlock heights
    (asserts! (< expires-at u9999999999) (err u500)) ;; Prevent unreasonably high expiration heights
    (map-set messages
      { id: new-id }
      {
        sender: tx-sender,
        recipient: recipient,
        message: message,
        unlock-height: unlock-height,
        expires-at: expires-at,
        is-encrypted: is-encrypted
      }
    )
    (var-set message-count new-id)
    (ok new-id)
  )
)

;; Function to retrieve a message
(define-read-only (get-message (id uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) (err u404))))
    (if (and (>= block-height (get unlock-height msg)) (< block-height (get expires-at msg)) (or (is-eq (get sender msg) tx-sender) (is-some (get recipient msg)) (is-eq tx-sender (some-unwrap! (get recipient msg)))))
      (ok msg)
      (err u403)
    )
  )
)

;; Function to delete a message
(define-public (delete-message (id uint))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) (err u404))))
    (if (is-eq (get sender msg) tx-sender)
      (begin
        (map-delete messages { id: id })
        (ok true)
      )
      (err u403)
    )
  )
)

;; Function to list all messages for a user
(define-read-only (list-user-messages)
  (let
    ((user-messages (filter 
      (lambda (entry) (is-eq (get sender (unwrap! (get-value entry) (err u500))) tx-sender))
      (map-entries messages)
    ))))
    (ok user-messages)
  )
)

;; Function to list all messages for a recipient
(define-read-only (list-recipient-messages)
  (let
    ((recipient-messages (filter
      (lambda (entry) (is-some (get recipient (unwrap! (get-value entry) (err u500))) ) )
      (map-entries messages)
    ))))
    (ok recipient-messages)
  )
)

;; Function to update a message
(define-public (update-message (id uint) (new-message (string-utf8 1024)) (new-unlock-height uint) (new-expires-at uint) (new-is-encrypted bool))
  (let
    ((msg (unwrap! (map-get? messages { id: id }) (err u404))))
    (if (is-eq (get sender msg) tx-sender)
      (begin
        (map-set messages
          { id: id }
          {
            sender: tx-sender,
            recipient: (get recipient msg),
            message: new-message,
            unlock-height: new-unlock-height,
            expires-at: new-expires-at,
            is-encrypted: new-is-encrypted
          }
        )
        (ok true)
      )
      (err u403)
    )
  )
)