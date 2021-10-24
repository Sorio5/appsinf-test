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