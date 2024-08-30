;; Define the data structure for our messages
(define-map messages
  { id: uint }
  {
    sender: principal,
    message: (string-utf8 1024),
    unlock-height: uint
  }
)

;; Keep track of the total number of messages
(define-data-var message-count uint u0)

;; Function to store a new message
(define-public (store-message (message (string-utf8 1024)) (unlock-height uint))
  (let
    ((new-id (+ (var-get message-count) u1)))
    (asserts! (< unlock-height u9999999999) (err u500)) ;; Prevent unreasonably high unlock heights
    (map-set messages
      { id: new-id }
      {
        sender: tx-sender,
        message: message,
        unlock-height: unlock-height
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
    (if (>= block-height (get unlock-height msg))
      (ok msg)
      (err u403)
    )
  )
)