;; Compliance Verification Contract
;; Ensures adherence to regulations

(define-map compliance-records
  { device-id: uint, compliance-id: uint }
  {
    verification-date: uint,
    regulation: (string-utf8 100),
    verified-by: principal,
    is-compliant: bool,
    expiry-date: uint,
    documentation: (string-utf8 200)
  }
)

(define-map device-compliance-count
  { device-id: uint }
  { count: uint }
)

;; Record compliance verification
(define-public (verify-compliance
    (device-id uint)
    (verification-date uint)
    (regulation (string-utf8 100))
    (is-compliant bool)
    (expiry-date uint)
    (documentation (string-utf8 200))
  )
  (let
    (
      (current-count (default-to { count: u0 } (map-get? device-compliance-count { device-id: device-id })))
      (new-count (+ (get count current-count) u1))
    )

    ;; Update the compliance count
    (map-set device-compliance-count
      { device-id: device-id }
      { count: new-count }
    )

    ;; Add the compliance record
    (map-set compliance-records
      { device-id: device-id, compliance-id: new-count }
      {
        verification-date: verification-date,
        regulation: regulation,
        verified-by: tx-sender,
        is-compliant: is-compliant,
        expiry-date: expiry-date,
        documentation: documentation
      }
    )

    (ok new-count)
  )
)

;; Get a specific compliance record
(define-read-only (get-compliance-record (device-id uint) (compliance-id uint))
  (map-get? compliance-records { device-id: device-id, compliance-id: compliance-id })
)

;; Check if a device is compliant with a specific regulation
(define-read-only (is-device-compliant (device-id uint) (regulation (string-utf8 100)) (current-date uint))
  (let
    (
      (count (default-to { count: u0 } (map-get? device-compliance-count { device-id: device-id })))
    )
    (if (> (get count count) u0)
      (let
        (
          (latest-record (unwrap-panic (map-get? compliance-records { device-id: device-id, compliance-id: (get count count) })))
        )
        (and
          (is-eq (get regulation latest-record) regulation)
          (get is-compliant latest-record)
          (< current-date (get expiry-date latest-record))
        )
      )
      false
    )
  )
)

;; Check if a device has any expired compliance records
(define-read-only (has-expired-compliance (device-id uint) (current-date uint))
  (let
    (
      (count (default-to { count: u0 } (map-get? device-compliance-count { device-id: device-id })))
    )
    (if (> (get count count) u0)
      (let
        (
          (latest-record (unwrap-panic (map-get? compliance-records { device-id: device-id, compliance-id: (get count count) })))
        )
        (>= current-date (get expiry-date latest-record))
      )
      true
    )
  )
)
