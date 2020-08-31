# SAGL: Cloud API
Cloud API for saves, configuration and asset storage for GTA San Andreas.


## Getting started
The API has 3 dependencies. `mysql`, `redis` and `aws s3`. 

Please ensure all are setup and configured in `config/development.json` (see `config/default.json` for an example config).


First, install the dependencies:
```bash
npm install
```

Then you can start the server:
```bash
npm start
```

When writing code, please lint your code before committing:
```bash
npm run lint
```
