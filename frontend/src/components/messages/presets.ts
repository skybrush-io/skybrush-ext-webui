/** Example messages that can be loaded into the editor on the Messages page. */
export const MESSAGE_PRESETS: Record<string, Record<string, unknown>> = {
  'AUTH-INF': { type: 'AUTH-INF' },
  'AUTH-REQ': {
    type: 'AUTH-REQ',
    method: 'basic',
    data: 'dXNlckBkb21haW4ueHl6OnBhc3N3b3Jk',
  },
  'AUTH-WHOAMI': { type: 'AUTH-WHOAMI' },
  'CLK-INF': { type: 'CLK-INF', ids: ['system'] },
  'CLK-LIST': { type: 'CLK-LIST' },
  'CONN-INF': {
    type: 'CONN-INF',
    ids: ['virtualConnection0', 'virtualConnection1'],
  },
  'CONN-LIST': { type: 'CONN-LIST' },
  'DEV-INF': {
    type: 'DEV-INF',
    paths: [
      '/COLLMOT-00',
      '/COLLMOT-01/thermometer',
      '/COLLMOT-02/thermometer/temperature',
    ],
  },
  'DEV-LIST': { type: 'DEV-LIST', ids: ['COLLMOT-01', 'COLLMOT-02'] },
  'DEV-LISTSUB': {
    type: 'DEV-LISTSUB',
    pathFilter: ['/COLLMOT-01', '/COLLMOT-01/thermometer', '/COLLMOT-00'],
  },
  'DEV-SUB': {
    type: 'DEV-SUB',
    paths: ['/COLLMOT-02/thermometer/temperature'],
  },
  'DEV-UNSUB': {
    type: 'DEV-UNSUB',
    paths: ['/COLLMOT-02/thermometer/temperature'],
  },
  'OBJ-CMD': {
    type: 'OBJ-CMD',
    ids: ['COLLMOT-01', 'COLLMOT-02'],
    command: 'yo',
  },
  'OBJ-LIST': { type: 'OBJ-LIST' },
  'SYS-PING': { type: 'SYS-PING' },
  'SYS-TIME': { type: 'SYS-TIME' },
  'SYS-VER': { type: 'SYS-VER' },
  'UAV-INF': { type: 'UAV-INF', ids: ['COLLMOT-01', 'COLLMOT-02'] },
  'UAV-LAND': { type: 'UAV-LAND', ids: ['COLLMOT-00'] },
  'UAV-LIST': { type: 'UAV-LIST' },
  'UAV-MOTOR': {
    type: 'UAV-MOTOR',
    ids: ['COLLMOT-00'],
    start: true,
    force: false,
  },
  'UAV-SIGNAL': {
    type: 'UAV-SIGNAL',
    ids: ['COLLMOT-00'],
    signals: ['light', 'sound'],
    duration: 1000,
  },
  'UAV-TAKEOFF': { type: 'UAV-TAKEOFF', ids: ['COLLMOT-00'] },
  'UAV-VER': { type: 'UAV-VER', ids: ['COLLMOT-00'] },
}

/** Notification types that are frequent and therefore hidden by default. */
export const NOISY_NOTIFICATION_TYPES = [
  'BCN-INF',
  'CONN-INF',
  'MSN-INF',
  'OBJ-DEL',
  'UAV-INF',
]
