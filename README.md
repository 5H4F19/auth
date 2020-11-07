# Initialization

```bash
 > npm i nexc
```

# Usage

## Steps

### 1. Create a **nexc.js** file and copy this

```javascript
const { auth } = require("authenticate");
auth();
```

### 2. Then go to command line and type

```bash
 > node nexc.js
```

### 3. Then **delete** the **nexc.js** file

### 4. Go to **package.json** file and add

```json
"scripts":{
    "dev":"webpack",
    "start":"nodemon server.js"
}
```

### 5. Run in command line

```bash
> npm run dev
```

### 6. Change **<span style="color:black;background:#F38DCE">&nbsp;%&nbsp;</span>**&nbsp;with **<span style="color:black;background:#F38DCE">&nbsp;\$&nbsp;</span>** in **server.js**, **mailtrap.pug**, **alerts.js** file

### 7. Again run in command line

```bash
> npm start
```
