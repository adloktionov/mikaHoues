import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',testMatch:'release.spec.ts',timeout:60000,use:{baseURL:'http://127.0.0.1:4174',headless:true,channel:'chrome',viewport:{width:1440,height:1000},screenshot:'only-on-failure'},webServer:{command:'npm run preview -- --strictPort',url:'http://127.0.0.1:4174',reuseExistingServer:false},reporter:'list'});
