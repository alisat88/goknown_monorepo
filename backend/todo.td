ATUALIZAR DOCKER

criar imagem:
docker run -d --name dev.postgres -e POSTGRESQL_USERNAME=root -e POSTGRESQL_PASSWORD=your_aiven_password_here -e POSTGRESQL_DATABASE=defaultdb -e POSTGRESQL_ADMIN_PASSWORD=your_password_here -p 15432:5432 -v ./:/docker-entrypoint-initdb.d bitnami/postgresql:12

Ajustar ngnix
