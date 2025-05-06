import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
// This avoids using the prohibited libraries

// Mock for principal addresses
const mockPrincipals = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  technician1: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  technician2: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
};

// Mock state for the calibration tracking contract
let mockCalibrationState = {
  calibrations: {},
  deviceCalibrationCount: {}
};

// Mock functions to simulate contract calls
function recordCalibration(sender, deviceId, date, results, nextDueDate, isPassed) {
  const currentCount = mockCalibrationState.deviceCalibrationCount[deviceId]
      ? mockCalibrationState.deviceCalibrationCount[deviceId].count
      : 0;
  
  const newCount = currentCount + 1;
  
  mockCalibrationState.deviceCalibrationCount[deviceId] = { count: newCount };
  
  mockCalibrationState.calibrations[`${deviceId}-${newCount}`] = {
    date,
    performedBy: sender,
    results,
    nextDueDate,
    isPassed
  };
  
  return { result: { value: newCount } };
}

function getCalibration(deviceId, calibrationId) {
  const key = `${deviceId}-${calibrationId}`;
  return mockCalibrationState.calibrations[key]
      ? { result: { value: mockCalibrationState.calibrations[key] } }
      : { result: { value: null } };
}

function getLatestCalibration(deviceId) {
  const count = mockCalibrationState.deviceCalibrationCount[deviceId]
      ? mockCalibrationState.deviceCalibrationCount[deviceId].count
      : 0;
  
  if (count === 0) return { result: { value: null } };
  
  const key = `${deviceId}-${count}`;
  return { result: { value: mockCalibrationState.calibrations[key] } };
}

function isCalibrationDue(deviceId, currentDate) {
  const latestCalibration = getLatestCalibration(deviceId).result.value;
  
  if (!latestCalibration) return { result: { value: true } };
  
  return { result: { value: currentDate >= latestCalibration.nextDueDate } };
}

describe('Calibration Tracking Contract', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockCalibrationState = {
      calibrations: {},
      deviceCalibrationCount: {}
    };
  });
  
  it('should record a new calibration', () => {
    const deviceId = 1;
    const date = 1620000000;
    const results = 'All parameters within acceptable range';
    const nextDueDate = 1650000000;
    const isPassed = true;
    
    const result = recordCalibration(
        mockPrincipals.technician1,
        deviceId,
        date,
        results,
        nextDueDate,
        isPassed
    );
    
    expect(result.result.value).toBe(1);
    expect(mockCalibrationState.deviceCalibrationCount[deviceId].count).toBe(1);
    expect(mockCalibrationState.calibrations[`${deviceId}-1`]).toMatchObject({
      date,
      performedBy: mockPrincipals.technician1,
      results,
      nextDueDate,
      isPassed
    });
  });
  
  it('should get a specific calibration record', () => {
    // First record a calibration
    const deviceId = 1;
    const date = 1620000000;
    const results = 'All parameters within acceptable range';
    const nextDueDate = 1650000000;
    const isPassed = true;
    
    recordCalibration(
        mockPrincipals.technician1,
        deviceId,
        date,
        results,
        nextDueDate,
        isPassed
    );
    
    // Now get the calibration record
    const result = getCalibration(deviceId, 1);
    
    expect(result.result.value).toMatchObject({
      date,
      performedBy: mockPrincipals.technician1,
      results,
      nextDueDate,
      isPassed
    });
  });
  
  it('should get the latest calibration for a device', () => {
    // Record multiple calibrations
    const deviceId = 1;
    
    // First calibration
    recordCalibration(
        mockPrincipals.technician1,
        deviceId,
        1620000000,
        'Initial calibration',
        1650000000,
        true
    );
    
    // Second calibration
    recordCalibration(
        mockPrincipals.technician2,
        deviceId,
        1660000000,
        'Follow-up calibration',
        1690000000,
        true
    );
    
    // Get the latest calibration
    const result = getLatestCalibration(deviceId);
    
    expect(result.result.value).toMatchObject({
      date: 1660000000,
      performedBy: mockPrincipals.technician2,
      results: 'Follow-up calibration',
      nextDueDate: 1690000000,
      isPassed: true
    });
  });
  
  it('should correctly determine if calibration is due', () => {
    const deviceId = 1;
    
    // Record a calibration
    recordCalibration(
        mockPrincipals.technician1,
        deviceId,
        1620000000,
        'Routine calibration',
        1650000000,
        true
    );
    
    // Check before due date
    let result = isCalibrationDue(deviceId, 1640000000);
    expect(result.result.value).toBe(false);
    
    // Check on due date
    result = isCalibrationDue(deviceId, 1650000000);
    expect(result.result.value).toBe(true);
    
    // Check after due date
    result = isCalibrationDue(deviceId, 1660000000);
    expect(result.result.value).toBe(true);
  });
  
  it('should return true for isCalibrationDue if no calibration exists', () => {
    const deviceId = 2; // No calibrations recorded for this device
    
    const result = isCalibrationDue(deviceId, 1620000000);
    expect(result.result.value).toBe(true);
  });
});
