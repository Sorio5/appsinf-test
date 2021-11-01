# Configuration
This file explains the different configuration options.

- `PORT`
  This option sets the port. Can be any number between 1 and 65535, but the port has to be available.
  Default is `8080`.
- `HOST`
  This option sets the host. Can be any domain name or IP address.
  Default is `localhost` - it runs locally.
- `DB_URL`
  This option sets the MongoDB URL to use when connecting to the database. It should have the format of `mongodb://user:password@host:port/options`.
  Default is `mongodb://localhost:27017/`.
- `SECRET`
  This option sets the server sessions secret. The secret is generated automagically at config creation though the server.
  Default is `null`.
- `SALT`
  This option sets the password salt. It is generated automagically at config creation through the server. **Be careful when changing this as this will invalidate current passwords**.
  Default is `null`.
- `TLS`
This option sets SSL/TLS/HTTPS certificate file paths.
  - `KEY`
  The host's certificate personal key file
  Default is `null`.
  - `CRT`
    The host's certificate file
    Default is `null`.
  - `CA`
    The Certificate Authority trust chain file
    Default is `null`.
  - `PW`
    The passphrase for the personal key.
    No default.
