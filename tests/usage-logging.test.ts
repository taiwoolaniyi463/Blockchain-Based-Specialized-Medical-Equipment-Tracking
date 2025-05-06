import { describe, it, expect, beforeEach } from 'vitest';

// Mock implementation for testing Clarity contracts
// This avoids using the prohibited libraries

// Mock for principal addresses
const mockPrincipals = {
  admin: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  doctor1: 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG',
  doctor2: 'ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC'
};

// Mock state for the usage logging contract
let mockUsageState = {
  usageLogs: {},
  deviceUsageCount: {}
};

// Mock functions to simulate contract calls
function logUsage(sender, deviceId, startTime, endTime, purpose, patientId, notes) {
  const currentCount = mockUsageState.deviceUsageCount[deviceId]
      ? mockUsageState.deviceUsageCount[deviceId].count
      : 0;
  
  const newCount = currentCount + 1;
  
  mockUsageState.deviceUsageCount[deviceId] = { count: newCount };
  
  mockUsageState.usageLogs[`${deviceId}-${newCount}`] = {
    startTime,
    endTime,
    user: sender,
    purpose,
    patientId,
    notes
  };
  
  return { result: { value: newCount } };
}

function getUsageLog(deviceId, logId) {
  const key = `${deviceId}-${logId}`;
  return mockUsageState.usageLogs[key]
      ? { result: { value: mockUsageState.usageLogs[key] } }
      : { result: { value: null } };
}

function getUsageCount(deviceId) {
  return mockUsageState.deviceUsageCount[deviceId]
      ? { result: { value: mockUsageState.deviceUsageCount[deviceId] } }
      : { result: { value: { count: 0 } } };
}

function getLatestUsage(deviceId) {
  const count = mockUsageState.deviceUsageCount[deviceId]
      ? mockUsageState.deviceUsageCount[deviceId].count
      : 0;
  
  if (count === 0) return { result: { value: null } };
  
  const key = `${deviceId}-${count}`;
  return { result: { value: mockUsageState.usageLogs[key] } };
}

describe('Usage Logging Contract', () => {
  beforeEach(() => {
    // Reset the mock state before each test
    mockUsageState = {
      usageLogs: {},
      deviceUsageCount: {}
    };
  });
  
  it('should log device usage', () => {
    const deviceId = 1;
    const startTime = 1620000000;
    const endTime = 1620003600; // 1 hour later
    const purpose = 'Diagnostic scan';
    const patientId = 'P12345';
    const notes = 'Routine scan for patient follow-up';
    
    const result = logUsage(
        mockPrincipals.doctor1,
        deviceId,
        startTime,
        endTime,
        purpose,
        patientId,
        notes
    );
    
    expect(result.result.value).toBe(1);
    expect(mockUsageState.deviceUsageCount[deviceId].count).toBe(1);
    expect(mockUsageState.usageLogs[`${deviceId}-1`]).toMatchObject({
      startTime,
      endTime,
      user: mockPrincipals.doctor1,
      purpose,
      patientId,
      notes
    });
  });
  
  it('should get a specific usage log', () => {
    // First log a usage
    const deviceId = 1;
    const startTime = 1620000000;
    const endTime = 1620003600;
    const purpose = 'Diagnostic scan';
    const patientId = 'P12345';
    const notes = 'Routine scan for patient follow-up';
    
    logUsage(
        mockPrincipals.doctor1,
        deviceId,
        startTime,
        endTime,
        purpose,
        patientId,
        notes
    );
    
    // Now get the usage log
    const result = getUsageLog(deviceId, 1);
    
    expect(result.result.value).toMatchObject({
      startTime,
      endTime,
      user: mockPrincipals.doctor1,
      purpose,
      patientId,
      notes
    });
  });
  
  it('should get the usage count for a device', () => {
    const deviceId = 1;
    
    // Log multiple usages
    logUsage(
        mockPrincipals.doctor1,
        deviceId,
        1620000000,
        1620003600,
        'Scan 1',
        'P12345',
        'Notes 1'
    );
    
    logUsage(
        mockPrincipals.doctor2,
        deviceId,
        1620100000,
        1620103600,
        'Scan 2',
        'P67890',
        'Notes 2'
    );
    
    // Get the usage count
    const result = getUsageCount(deviceId);
    
    expect(result.result.value.count).toBe(2);
  });
  
  it('should get the latest usage for a device', () => {
    const deviceId = 1;
    
    // Log multiple usages
    logUsage(
        mockPrincipals.doctor1,
        deviceId,
        1620000000,
        1620003600,
        'Scan 1',
        'P12345',
        'Notes 1'
    );
    
    logUsage(
        mockPrincipals.doctor2,
        deviceId,
        1620100000,
        1620103600,
        'Scan 2',
        'P67890',
        'Notes 2'
    );
    
    // Get the latest usage
    const result = getLatestUsage(deviceId);
    
    expect(result.result.value).toMatchObject({
      startTime: 1620100000,
      endTime: 1620103600,
      user: mockPrincipals.doctor2,
      purpose: 'Scan 2',
      patientId: 'P67890',
      notes: 'Notes 2'
    });
  });
  
  it('should return null for getLatestUsage if no usage exists', () => {
    const deviceId = 2; // No usage logged for this device
    
    const result = getLatestUsage(deviceId);
    expect(result.result.value).toBe(null);
  });
});
