# APIs de F1 Fan App - TFT

Este repositorio contiene dos APIs desarrolladas en PHP y Node.js para el proyecto de TFT de la aplicación iOS "F1 Fan" y la interfaz web para la base de datos de esta aplicación.

## Enlaces a proyectos

- [Repositorio de la aplicación iOS "F1 Fan"](https://github.com/Javierob02/F1Fan_APP)
- [Repositorio de la interfaz web de la base de datos](https://github.com/Javierob02/WebManager_TFG)


> ⚠️ **Advertencia:** La API PHP debe estar arrancada antes de usar la API Node.js.


## API en PHP

### Instalación

Para la API en PHP, primero debes obtener alguna forma para correr archivos PHP. En este caso usaremos [XAMPP](https://www.apachefriends.org/es/index.html). Crearemos un directorio llamado "F1API" dentro de la carpeta "htdocs" en XAMPP y luego correremos la API corriendo el "Apache Web Server".

Es importante destacar que antes de hacer esto, se deberá configurar en el archivo "db.php" la configuración de acceso a la base de datos MySQL:

```php
$host = "IP:PORT";
$username = "USERNAME";
$password = "PASSWORD";
$database = "DATABASE";
```

### Acceso a la API PHP

El acceso a la API PHP se realizará a traves de la URL:

```bash
localhost/F1API/api.php...
```




## API en Node.js

### Instalación

Para la API en Node.js, primero debes instalar los módulos necesarios utilizando npm. Ejecuta el siguiente comando en la raíz del proyecto:

```sh
npm install
````

A continuación se deberá añadir al proyecto el .JSON de configuración del Firebase y referenciarlo:

```js
const serviceAccount = require('./f1fans-aa206-firebase-adminsdk-en8aj-23f796e2d0.json');
````

Se rellena la configuración de Firebase con los datos ot¡riginales:

```js
// Initialize Firebase app
const firebaseConfig = {
  //Firebase Config
};
````
Y finalmente se arranca la API de NODE.js:

```sh
node app.js
```

### Acceso a la API NODE.js

El acceso a la API NODE.js se realizará a traves de la URL:

```bash
http://localhost:3000/api/...
```


