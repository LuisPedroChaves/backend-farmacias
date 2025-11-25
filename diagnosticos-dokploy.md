# Comandos de Diagnóstico para Dokploy

## PASO 0: Encontrar el nombre del contenedor de Traefik
```bash
docker ps | grep -i traefik
```
Busca el nombre exacto del contenedor (podría ser `dokploy-traefik`, `traefik`, etc.)

## 1. Verificar que el contenedor está corriendo
```bash
docker ps | grep farmacias-backend
```
Deberías ver el contenedor `farmacias-backend` en la lista.

## 2. Verificar los logs del contenedor
```bash
docker logs farmacias-backend --tail 50
```
Busca mensajes como "Servidor corriendo en el puerto 3000" y "Connection to CosmosDB successful".

## 3. Verificar que la aplicación responde internamente
```bash
docker exec farmacias-backend wget -O- http://localhost:3000
```
Deberías ver: `{"ok":true,"mensaje":"¡Bienvenidos al Backend!"}`

## 4. Ver todos los contenedores en la red dokploy
```bash
docker network inspect dokploy-network --format='{{range .Containers}}{{.Name}} {{end}}'
```
Esto te mostrará todos los contenedores conectados, incluyendo Traefik.

## 5. Verificar los logs de Traefik
```bash
docker logs dokploy-traefik --tail 100 | grep -i farmacias
```

## 6. Verificar los routers de Traefik
```bash
docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers
```

## 7. Probar conectividad desde Traefik a tu backend
```bash
docker exec dokploy-traefik wget -O- http://farmacias-backend:3000
```

## 8. Ver los servicios HTTP de Traefik
```bash
docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/services
```

## 9. Ver el estado completo de Traefik para farmacias
```bash
docker exec dokploy-traefik wget -qO- http://localhost:8080/api/http/routers | python3 -c "import sys, json; routers = json.load(sys.stdin); [print(json.dumps(r, indent=2)) for r in routers if 'farmacias' in r.get('name', '').lower()]"
```

## Pasos de diagnóstico recomendados:

1. **Ejecuta los comandos 1, 2 y 3** para confirmar que tu app funciona
2. **Ejecuta el comando 4** para ver las etiquetas de Traefik
3. **Comparte el output** de esos comandos para continuar el diagnóstico

## Nota importante:
El PORT debe ser 3000 (no 3001) porque:
- `expose: - "3000"` dice que el contenedor expone el puerto 3000
- `PORT=3000` debe coincidir con el expose
- Traefik debe apuntar al puerto 3000 con `loadbalancer.server.port=3000`
