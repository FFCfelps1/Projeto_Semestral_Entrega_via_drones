const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'./tests/browser', workers:1, timeout:60000, expect:{timeout:15000},
  outputDir:'.kubernetes-local/browser-artifacts',
  reporter:[['list'],['json',{outputFile:'.kubernetes-local/browser-results.json'}]],
  use:{baseURL:process.env.APP_URL||'http://127.0.0.1:8080',browserName:'chromium',
    channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true,
    screenshot:'only-on-failure',trace:'retain-on-failure'},
});
