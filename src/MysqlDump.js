let _logger = { log: () => {} };
let _requestor = null;
let _readFileSync = null;
let _existsSync = null;

class MysqlDump {

  static inject({ requestor, logger, readFileSync, existsSync }) {
    logger && MysqlDump.setLogger(logger);
    requestor && MysqlDump.setRequestor(requestor);
    _readFileSync = readFileSync || null;
    _existsSync = existsSync || null;
  }

  static setRequestor(req) {
    _requestor = req;
  }

  static getRequestor() {
    if (!_requestor) {
      throw new Error('Must set Requestor first');
    }
    return _requestor;
  }

  static setLogger(logger) {
    _logger = logger;
  }

  static getLogger() {
    if (null === _logger) {
      throw new Error('You must set the logger first');
    }
    return _logger;
  }


  static async executeSqlFileOnExistingConnection(filePath) {
    if (!_existsSync(filePath)) {
      throw new Error('File path does not exists ');
    }
    _logger.log('executeSchemaOntoExistingConnection');
    await MysqlDump.getRequestor().query({
      sql: _readFileSync(filePath, 'utf-8'),
    });
  }

  static async executeSqlFile({ filePath, connectionConfig, disconnectOnFinish }) {
    _logger.log(`MysqlDump:executeSqlFile(${filePath})`);
    if (!connectionConfig) {
      let letMysqlReqLoadDefaultEnvConfig = true;
      connectionConfig = letMysqlReqLoadDefaultEnvConfig && {};
    }

    let { multipleStatements, ...connectionConfigWithoutMS } = connectionConfig;

    MysqlDump.getRequestor().setConnectionConfig({
      multipleStatements: true,
      ...connectionConfigWithoutMS
    });

    await MysqlDump.executeSqlFileOnExistingConnection(filePath);

    if (typeof disconnectOnFinish === 'undefined') {
      disconnectOnFinish = true;
    }

    if (disconnectOnFinish) {
      await MysqlDump.getRequestor().disconnect();
    }
  }
}

export default MysqlDump;
