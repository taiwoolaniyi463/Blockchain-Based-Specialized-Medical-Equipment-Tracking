;; Calibration Tracking Contract
;; Manages regular accuracy verification

(define-map calibrations
  { device-id: uint, calibration-id: uint }
  {
    date: uint,
    performed-by: principal,
    results: (string-utf8 200),
    next-due-date: uint,
    is-passed: bool
  }
)

(define-map device-calibration-count
  { device-id: uint }
  { count: uint }
)

;; Record a new calibration
(define-public (record-calibration
    (device-id uint)
    (date uint)
    (results (string-utf8 200))
    (next-due-date uint)
    (is-passed bool)
  )
  (let
    (
      (current-count (default-to { count: u0 } (map-get? device-calibration-count { device-id: device-id })))
      (new-count (+ (get count current-count) u1))
    )

    ;; Update the calibration count
    (map-set device-calibration-count
      { device-id: device-id }
      { count: new-count }
    )

    ;; Add the calibration record
    (map-set calibrations
      { device-id: device-id, calibration-id: new-count }
      {
        date: date,
        performed-by: tx-sender,
        results: results,
        next-due-date: next-due-date,
        is-passed: is-passed
      }
    )

    (ok new-count)
  )
)

;; Get a specific calibration record
(define-read-only (get-calibration (device-id uint) (calibration-id uint))
  (map-get? calibrations { device-id: device-id, calibration-id: calibration-id })
)

;; Get the latest calibration for a device
(define-read-only (get-latest-calibration (device-id uint))
  (let
    (
      (count (default-to { count: u0 } (map-get? device-calibration-count { device-id: device-id })))
    )
    (if (> (get count count) u0)
      (map-get? calibrations { device-id: device-id, calibration-id: (get count count) })
      none
    )
  )
)

;; Check if a device is due for calibration
(define-read-only (is-calibration-due (device-id uint) (current-date uint))
  (let
    (
      (latest-calibration (get-latest-calibration device-id))
    )
    (if (is-some latest-calibration)
      (let
        (
          (calibration (unwrap-panic latest-calibration))
          (next-due (get next-due-date calibration))
        )
        (>= current-date next-due)
      )
      true
    )
  )
)
