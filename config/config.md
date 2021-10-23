# Configuration
This file explains the different configuration options.

- `PORT`
This option sets the port. Can be any number between 1 and 65535, but the port has to be available. Default is `8080`.
- `HOST`
This option sets the host. Can be any domain name or IP address. Default is `localhost` - it runs locally.
- `DB_URL`
This option sets the MongoDB URL to use when connecting to the database. It should have the format of `mongodb://user:password@host:port/options`. Default is `mongodb://localhost:27017/`.
- `SECRET`
This option sets the server sessions secret. The secret is generated automagically at config creation though the server. Default is `null`.