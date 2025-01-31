;; Additional Constants
(define-constant ERR-INVALID-BATCH-SIZE (err u501))
(define-constant ERR-NO-MESSAGES (err u502))
(define-constant MAX-BATCH-SIZE u50)

;; Enhanced data structure for messages with tags
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
    last-modified: uint,
    tags: (list 5 (string-utf8 32))  ;; New field for message tags
  }
)

;; New map to track message tags for efficient querying
(define-map message-tags
  { tag: (string-utf8 32) }
  (list 100 uint)
)

;; Enhanced user statistics
(define-map user-stats 
  { user: principal }
  {
    messages-sent: uint,
    messages-received: uint,
    last-activity: uint,
    categories-used: (list 10 (string-utf8 64)),  ;; Track user's preferred categories
    avg-unlock-duration: uint                      ;; Average time lock duration
  }
)

;; Optimized store-message function with tags
(define-public (store-message-with-tags
    (message (string-utf8 1024)) 
    (unlock-height uint)
    (category (optional (string-utf8 64)))
    (recipient (optional principal))
    (tags (list 5 (string-utf8 32))))
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
        last-modified: block-height,
        tags: tags
      }
    )
    ;; Update tag indices
    (map update-tag-index (map (lambda (tag) (tuple (tag tag) (id new-id))) tags))
    ;; Update enhanced user stats
    (update-enhanced-user-stats tx-sender recipient category unlock-height)
    (var-set message-count new-id)
    (ok new-id)
  )
)

;; New function to get messages by tag
(define-read-only (get-messages-by-tag (tag (string-utf8 32)) (limit uint))
  (let
    ((message-ids (default-to (list) (map-get? message-tags { tag: tag }))))
    (asserts! (<= limit MAX-BATCH-SIZE) ERR-INVALID-BATCH-SIZE)
    (asserts! (> (len message-ids) u0) ERR-NO-MESSAGES)
    (ok (map get-message-info (take limit message-ids)))
  )
)

;; Optimized private function to update tag indices
(define-private (update-tag-index (params { tag: (string-utf8 32), id: uint }))
  (let
    ((current-ids (default-to (list) (map-get? message-tags { tag: (get tag params) }))))
    (map-set message-tags
      { tag: (get tag params) }
      (append current-ids (list (get id params)))
    )
  )
)

;; Enhanced user stats update function
(define-private (update-enhanced-user-stats 
    (sender principal)
    (recipient (optional principal))
    (category (optional (string-utf8 64)))
    (unlock-height uint))
  (let
    ((current-stats (default-to 
      { 
        messages-sent: u0, 
        messages-received: u0, 
        last-activity: block-height,
        categories-used: (list),
        avg-unlock-duration: u0
      }
      (map-get? user-stats { user: sender }))))
    (map-set user-stats
      { user: sender }
      {
        messages-sent: (+ (get messages-sent current-stats) u1),
        messages-received: (get messages-received current-stats),
        last-activity: block-height,
        categories-used: (match category
          cat (append (get categories-used current-stats) (list cat))
          (get categories-used current-stats)),
        avg-unlock-duration: (/ (+ 
          (* (get avg-unlock-duration current-stats) (get messages-sent current-stats))
          (- unlock-height block-height)
        ) (+ (get messages-sent current-stats) u1))
      }
    )
    (match recipient
      recipient-principal (update-recipient-stats recipient-principal)
      true
    )
  )
)

;; Helper function for recipient stats
(define-private (update-recipient-stats (recipient principal))
  (let
    ((current-stats (default-to 
      { 
        messages-sent: u0, 
        messages-received: u0, 
        last-activity: block-height,
        categories-used: (list),
        avg-unlock-duration: u0
      }
      (map-get? user-stats { user: recipient }))))
    (map-set user-stats
      { user: recipient }
      (merge current-stats {
        messages-received: (+ (get messages-received current-stats) u1),
        last-activity: block-height
      })
    )
  )
)

;; New function to get user analytics
(define-read-only (get-user-analytics (user principal))
  (let
    ((stats (unwrap! (map-get? user-stats { user: user }) ERR-NOT-FOUND)))
    (ok {
      total-messages: (+ (get messages-sent stats) (get messages-received stats)),
      avg-unlock-duration: (get avg-unlock-duration stats),
      categories: (get categories-used stats),
      activity-score: (if (is-eq (get last-activity stats) u0)
        u0
        (/ (* u100 (- block-height (get last-activity stats))) block-height))
    })
  )
)