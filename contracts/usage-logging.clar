;; Usage Logging Contract
;; Records equipment utilization

(define-map usage-logs
  { device-id: uint, log-id: uint }
  {
    start-time: uint,
    end-time: uint,
    user: principal,
    purpose: (string-utf8 200),
    patient-id: (optional (string-utf8 50)),
    notes: (string-utf8 500)
  }
)

(define-map device-usage-count
  { device-id: uint }
  { count: uint }
)

;; Log device usage
(define-public (log-usage
    (device-id uint)
    (start-time uint)
    (end-time uint)
    (purpose (string-utf8 200))
    (patient-id (optional (string-utf8 50)))
    (notes (string-utf8 500))
  )
  (let
    (
      (current-count (default-to { count: u0 } (map-get? device-usage-count { device-id: device-id })))
      (new-count (+ (get count current-count) u1))
    )

    ;; Update the usage count
    (map-set device-usage-count
      { device-id: device-id }
      { count: new-count }
    )

    ;; Add the usage log
    (map-set usage-logs
      { device-id: device-id, log-id: new-count }
      {
        start-time: start-time,
        end-time: end-time,
        user: tx-sender,
        purpose: purpose,
        patient-id: patient-id,
        notes: notes
      }
    )

    (ok new-count)
  )
)

;; Get a specific usage log
(define-read-only (get-usage-log (device-id uint) (log-id uint))
  (map-get? usage-logs { device-id: device-id, log-id: log-id })
)

;; Get the total usage count for a device
(define-read-only (get-usage-count (device-id uint))
  (default-to { count: u0 } (map-get? device-usage-count { device-id: device-id }))
)

;; Get the latest usage log for a device
(define-read-only (get-latest-usage (device-id uint))
  (let
    (
      (count (default-to { count: u0 } (map-get? device-usage-count { device-id: device-id })))
    )
    (if (> (get count count) u0)
      (map-get? usage-logs { device-id: device-id, log-id: (get count count) })
      none
    )
  )
)
