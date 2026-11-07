# metalab-drinks
This project contains the backend and frontend code for the Metadrinks project.

## Setting up
Copy `docker-compose.yml` and `.env.example` and to your project root directory. Replace the values in the example file accordingly and remove the `.example` suffix.

To start, execute `docker compose up -d`. If required or wanted, you can change the ports (in the format `host-port:container-port`, only change the host-port) or the version to ensure no unwanted upgrades happen.

## Usage
On first start, a default guest and admin (a-admin) user are generated. The admin password will be printed to your console ONCE (visible by either running `docker compose up` when starting or `docker compose logs` after start).

After the first start, it is recommended to change the admin password via the admin interface under `/admin`. From this page, all management of items, users, readers and purchases takes place.

### API Docs
Currently, the API docs are served by the backend under /docs/index.html with the file "../swapper.json".
