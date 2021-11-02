# Mongo DB
This file explains the Mongo Database structure.

## Table `users`
| Human Readable Name | Database Field  | Description |
| ------------------- | --------------- | ----------- |
| User name           | `username`      | User/connection name. Has to be **unique** |
| Display name        | `display_name`  | Name to display |
| Email               | `email`         | Contact email address |
| Password            | `password`      | Salted SHA-2 password |
| Member since        | `creation_date` | UNIX timestamp of user's account creation |
| Last visit          | `last_visit`    | UNIX timestamp of user's last connection |

## Table `incidents`
| Human Readable Name  | Database Field  | Description |
| -------------------- | --------------- | ----------- |
| Incident description | `description`   | Incident description |
| Incident address     | `address`       | Incident address/location |
| Author               | `author`        | Incident author - username from table `users` |
| Status               | `status`        | Status of the incident. One of `Recorded`, `Work in Progress` or `Done` |
| Creation date        | `creation_date` | UNIX timestamp of incident creation |
| Last update          | `last_update`   | UNIX timestamp of incident last update |