/* Payroll Transaction list — demo data.
 *
 * DETERMINISTIC BY DESIGN (see prep plan D1.4). Every value here is hard-coded:
 * no Math.random(), no new Date(). A date computed from "now" is the classic flake
 * source and would silently break this page months from now.
 *
 * Amounts are stored in oere (integer cents) so no floating-point drift can ever
 * change a displayed total. Format with fmtAmount() in app.js.
 */

var EMPLOYEES = [
  { no: '1042', name: 'Anna Berg' },
  { no: '1077', name: 'Lars Haugen' },
  { no: '1103', name: 'Ingrid Solberg' },
  { no: '1128', name: 'Ola Nilsen' },
  { no: '1154', name: 'Kari Dahl' },
  { no: '1189', name: 'Per Johansen' },
  { no: '1205', name: 'Hanne Lie' },
  { no: '1233', name: 'Jonas Moe' }
];

var RUNS = [
  { id: '2026-03', label: 'March 2026', state: 'Closed', paidOn: '25.03.2026' },
  { id: '2026-04', label: 'April 2026', state: 'Closed', paidOn: '24.04.2026' },
  { id: '2026-05', label: 'May 2026', state: 'Open', paidOn: 'not yet paid' }
];

/* The run every exercise uses. */
var DEFAULT_RUN = '2026-05';

function audit(createdBy, createdAt, changedBy, changedAt) {
  return { createdBy: createdBy, createdAt: createdAt, changedBy: changedBy, changedAt: changedAt };
}

var TRANSACTIONS = [
  /* ---------- May 2026 run: 24 transactions, 8 employees, 3 each ---------- */

  { id: 'T-1001', run: '2026-05', employeeNo: '1042', employeeName: 'Anna Berg',
    type: 'Salary', period: '2026-05', amount: 5200000, costCenter: 'CC-100',
    projectCode: 'PRJ-A', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'hanne.lie', '06.05.2026 11:42') },

  { id: 'T-1002', run: '2026-05', employeeNo: '1042', employeeName: 'Anna Berg',
    type: 'Overtime', period: '2026-05', amount: 430000, costCenter: 'CC-100',
    projectCode: 'PRJ-A', account: '5010', status: 'Pending', severity: null,
    retroOf: null, error: null,
    audit: audit('hanne.lie', '11.05.2026 09:05', null, null) },

  { id: 'T-1003', run: '2026-05', employeeNo: '1042', employeeName: 'Anna Berg',
    type: 'Reimbursement', period: '2026-05', amount: 125000, costCenter: 'CC-100',
    projectCode: '', account: '7140', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('anna.berg', '08.05.2026 16:20', 'jonas.moe', '12.05.2026 08:55') },

  { id: 'T-1004', run: '2026-05', employeeNo: '1077', employeeName: 'Lars Haugen',
    type: 'Salary', period: '2026-05', amount: 4850000, costCenter: 'CC-100',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'hanne.lie', '06.05.2026 11:42') },

  { id: 'T-1005', run: '2026-05', employeeNo: '1077', employeeName: 'Lars Haugen',
    type: 'Overtime', period: '2026-05', amount: 620000, costCenter: 'CC-100',
    projectCode: 'PRJ-B', account: '5010', status: 'Error', severity: 'blocking',
    retroOf: null,
    error: {
      reason: 'Overtime is above the monthly limit in this employee contract.',
      rule: 'Maximum overtime per month: 5 000,00',
      actual: '6 200,00 registered for May 2026',
      fixLabel: 'Open the overtime registration for Lars Haugen'
    },
    audit: audit('lars.haugen', '09.05.2026 17:31', null, null) },

  { id: 'T-1006', run: '2026-05', employeeNo: '1077', employeeName: 'Lars Haugen',
    type: 'Deduction', period: '2026-05', amount: -180000, costCenter: 'CC-100',
    projectCode: '', account: '5290', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', null, null) },

  { id: 'T-1007', run: '2026-05', employeeNo: '1103', employeeName: 'Ingrid Solberg',
    type: 'Salary', period: '2026-05', amount: 6100000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Error', severity: 'blocking',
    retroOf: null,
    error: {
      reason: 'No valid tax card on file, so tax cannot be calculated.',
      rule: 'A valid tax card is required before payment',
      actual: 'No tax card received for 2026',
      fixLabel: 'Open the tax card page for Ingrid Solberg'
    },
    audit: audit('system.import', '02.05.2026 04:10', 'payroll.admin', '13.05.2026 10:02') },

  { id: 'T-1008', run: '2026-05', employeeNo: '1103', employeeName: 'Ingrid Solberg',
    type: 'Overtime', period: '2026-05', amount: 240000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5010', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('ingrid.solberg', '10.05.2026 12:44', 'hanne.lie', '12.05.2026 09:10') },

  { id: 'T-1009', run: '2026-05', employeeNo: '1103', employeeName: 'Ingrid Solberg',
    type: 'Salary', period: '2026-03', amount: 350000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Pending', severity: null,
    retroOf: { id: 'T-0903', run: '2026-03', label: 'March 2026' },
    error: null,
    audit: audit('payroll.admin', '12.05.2026 14:08', null, null) },

  { id: 'T-1010', run: '2026-05', employeeNo: '1128', employeeName: 'Ola Nilsen',
    type: 'Salary', period: '2026-05', amount: 4500000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'hanne.lie', '06.05.2026 11:42') },

  { id: 'T-1011', run: '2026-05', employeeNo: '1128', employeeName: 'Ola Nilsen',
    type: 'Deduction', period: '2026-05', amount: -220000, costCenter: 'CC-200',
    projectCode: '', account: '5290', status: 'Pending', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', null, null) },

  { id: 'T-1012', run: '2026-05', employeeNo: '1128', employeeName: 'Ola Nilsen',
    type: 'Reimbursement', period: '2026-05', amount: 89000, costCenter: 'CC-200',
    projectCode: '', account: '7140', status: 'Error', severity: 'warning',
    retroOf: null,
    error: {
      reason: 'No receipt attached. This can still be paid, but it will be flagged in the audit.',
      rule: 'Receipt required above 500,00',
      actual: '890,00 with no receipt attached',
      fixLabel: 'Open the reimbursement and attach a receipt'
    },
    audit: audit('ola.nilsen', '07.05.2026 13:26', null, null) },

  { id: 'T-1013', run: '2026-05', employeeNo: '1154', employeeName: 'Kari Dahl',
    type: 'Salary', period: '2026-05', amount: 5500000, costCenter: 'CC-300',
    projectCode: 'PRJ-A', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'hanne.lie', '06.05.2026 11:42') },

  { id: 'T-1014', run: '2026-05', employeeNo: '1154', employeeName: 'Kari Dahl',
    type: 'Overtime', period: '2026-05', amount: 310000, costCenter: 'CC-300',
    projectCode: 'PRJ-A', account: '5010', status: 'Pending', severity: null,
    retroOf: null, error: null,
    audit: audit('kari.dahl', '11.05.2026 08:12', null, null) },

  { id: 'T-1015', run: '2026-05', employeeNo: '1154', employeeName: 'Kari Dahl',
    type: 'Overtime', period: '2026-04', amount: 190000, costCenter: 'CC-300',
    projectCode: 'PRJ-A', account: '5010', status: 'Pending', severity: null,
    retroOf: { id: 'T-0985', run: '2026-04', label: 'April 2026' },
    error: null,
    audit: audit('payroll.admin', '12.05.2026 14:15', null, null) },

  { id: 'T-1016', run: '2026-05', employeeNo: '1189', employeeName: 'Per Johansen',
    type: 'Salary', period: '2026-05', amount: 4950000, costCenter: 'CC-300',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'hanne.lie', '06.05.2026 11:42') },

  { id: 'T-1017', run: '2026-05', employeeNo: '1189', employeeName: 'Per Johansen',
    type: 'Deduction', period: '2026-05', amount: -340000, costCenter: 'CC-300',
    projectCode: '', account: '5290', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'jonas.moe', '09.05.2026 15:37') },

  { id: 'T-1018', run: '2026-05', employeeNo: '1189', employeeName: 'Per Johansen',
    type: 'Reimbursement', period: '2026-05', amount: 215000, costCenter: 'CC-300',
    projectCode: '', account: '7140', status: 'Pending', severity: null,
    retroOf: null, error: null,
    audit: audit('per.johansen', '10.05.2026 07:48', null, null) },

  { id: 'T-1019', run: '2026-05', employeeNo: '1205', employeeName: 'Hanne Lie',
    type: 'Salary', period: '2026-05', amount: 5800000, costCenter: 'CC-100',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', 'payroll.admin', '06.05.2026 11:42') },

  { id: 'T-1020', run: '2026-05', employeeNo: '1205', employeeName: 'Hanne Lie',
    type: 'Overtime', period: '2026-05', amount: 480000, costCenter: 'CC-100',
    projectCode: 'PRJ-C', account: '5010', status: 'Error', severity: 'blocking',
    retroOf: null,
    error: {
      reason: 'The employee has no active bank account, so the payment cannot be sent.',
      rule: 'An active bank account is required before payment',
      actual: 'No active account since 30.04.2026',
      fixLabel: 'Open the bank details for Hanne Lie'
    },
    audit: audit('hanne.lie', '11.05.2026 10:19', null, null) },

  { id: 'T-1021', run: '2026-05', employeeNo: '1205', employeeName: 'Hanne Lie',
    type: 'Reimbursement', period: '2026-05', amount: 64000, costCenter: 'CC-100',
    projectCode: '', account: '7140', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('hanne.lie', '05.05.2026 09:33', 'jonas.moe', '12.05.2026 08:55') },

  { id: 'T-1022', run: '2026-05', employeeNo: '1233', employeeName: 'Jonas Moe',
    type: 'Salary', period: '2026-05', amount: 4300000, costCenter: 'CC-300',
    projectCode: 'PRJ-B', account: '5000', status: 'Pending', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', null, null) },

  { id: 'T-1023', run: '2026-05', employeeNo: '1233', employeeName: 'Jonas Moe',
    type: 'Overtime', period: '2026-05', amount: 540000, costCenter: 'CC-300',
    projectCode: 'PRJ-B', account: '5010', status: 'Error', severity: 'blocking',
    retroOf: null,
    error: {
      reason: 'Overtime is above the monthly limit in this employee contract.',
      rule: 'Maximum overtime per month: 5 000,00',
      actual: '5 400,00 registered for May 2026',
      fixLabel: 'Open the overtime registration for Jonas Moe'
    },
    audit: audit('jonas.moe', '10.05.2026 18:02', null, null) },

  { id: 'T-1024', run: '2026-05', employeeNo: '1233', employeeName: 'Jonas Moe',
    type: 'Deduction', period: '2026-05', amount: -95000, costCenter: 'CC-300',
    projectCode: '', account: '5290', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.05.2026 04:10', null, null) },

  /* ---------- March 2026 run (closed) — exists so the run list is a real flow ---------- */

  { id: 'T-0901', run: '2026-03', employeeNo: '1042', employeeName: 'Anna Berg',
    type: 'Salary', period: '2026-03', amount: 5100000, costCenter: 'CC-100',
    projectCode: 'PRJ-A', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  { id: 'T-0902', run: '2026-03', employeeNo: '1077', employeeName: 'Lars Haugen',
    type: 'Salary', period: '2026-03', amount: 4850000, costCenter: 'CC-100',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  { id: 'T-0903', run: '2026-03', employeeNo: '1103', employeeName: 'Ingrid Solberg',
    type: 'Salary', period: '2026-03', amount: 5750000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  { id: 'T-0904', run: '2026-03', employeeNo: '1128', employeeName: 'Ola Nilsen',
    type: 'Salary', period: '2026-03', amount: 4500000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  { id: 'T-0905', run: '2026-03', employeeNo: '1154', employeeName: 'Kari Dahl',
    type: 'Salary', period: '2026-03', amount: 5500000, costCenter: 'CC-300',
    projectCode: 'PRJ-A', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  { id: 'T-0906', run: '2026-03', employeeNo: '1189', employeeName: 'Per Johansen',
    type: 'Salary', period: '2026-03', amount: 4950000, costCenter: 'CC-300',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.03.2026 04:10', 'hanne.lie', '06.03.2026 10:21') },

  /* ---------- April 2026 run (closed) ---------- */

  { id: 'T-0981', run: '2026-04', employeeNo: '1042', employeeName: 'Anna Berg',
    type: 'Salary', period: '2026-04', amount: 5200000, costCenter: 'CC-100',
    projectCode: 'PRJ-A', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.04.2026 04:10', 'hanne.lie', '07.04.2026 09:55') },

  { id: 'T-0982', run: '2026-04', employeeNo: '1077', employeeName: 'Lars Haugen',
    type: 'Salary', period: '2026-04', amount: 4850000, costCenter: 'CC-100',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.04.2026 04:10', 'hanne.lie', '07.04.2026 09:55') },

  { id: 'T-0983', run: '2026-04', employeeNo: '1103', employeeName: 'Ingrid Solberg',
    type: 'Salary', period: '2026-04', amount: 6100000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.04.2026 04:10', 'hanne.lie', '07.04.2026 09:55') },

  { id: 'T-0984', run: '2026-04', employeeNo: '1128', employeeName: 'Ola Nilsen',
    type: 'Salary', period: '2026-04', amount: 4500000, costCenter: 'CC-200',
    projectCode: 'PRJ-C', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.04.2026 04:10', 'hanne.lie', '07.04.2026 09:55') },

  { id: 'T-0985', run: '2026-04', employeeNo: '1154', employeeName: 'Kari Dahl',
    type: 'Overtime', period: '2026-04', amount: 280000, costCenter: 'CC-300',
    projectCode: 'PRJ-A', account: '5010', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('kari.dahl', '09.04.2026 16:40', 'hanne.lie', '14.04.2026 11:02') },

  { id: 'T-0986', run: '2026-04', employeeNo: '1189', employeeName: 'Per Johansen',
    type: 'Salary', period: '2026-04', amount: 4950000, costCenter: 'CC-300',
    projectCode: 'PRJ-B', account: '5000', status: 'Approved', severity: null,
    retroOf: null, error: null,
    audit: audit('system.import', '02.04.2026 04:10', 'hanne.lie', '07.04.2026 09:55') }
];

/* variant=c drops exactly this one row from the GRAND TOTAL only (see app.js).
 * 440 180,00 becomes 438 030,00 — plausible, and invisible to the eye. */
var VARIANT_C_DROPPED_ROW = 'T-1018';
