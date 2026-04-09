eval(`
// This looks like an HTML file but appears as .js in Sources
const IndexHTML = \`
<!DOCTYPE html>
<html>
<head><title> ADMIN PORTAL</title></head>
<body>
    <h1>SECURE ADMIN PANEL</h1>
    <p>Restricted area - Unauthorized access prohibited</p>
    <form>
        <input type="text" placeholder="Admin username">
        <input type="password" placeholder="Access key">
    </form>
    <script>console.log(" admin portal loaded");<\/script>
</body>
</html>
\`;
console.log("index.html (admin portal) loaded in memory");
//# sourceURL=index-html.js
`);

eval(`
// This looks like an HTML file but appears as .js in Sources
const AppHTML = \`
<!DOCTYPE html>
<html>
<head><title>APP DASHBOARD</title></head>
<body>
    <h1>APPLICATION DASHBOARD</h1>
    <p>Version: 5.2.0</p>
    <p>Connected users: 1,247</p>
    <p>Database: connected</p>
    <script>console.log("app dashboard loaded");<\/script>
</body>
</html>
\`;
console.log(" app.html (dashboard) loaded in memory");
//# sourceURL=app-html.js
`);

console.log("2HTML files created - they appear as .js files in Sources tab");