import {readdirSync, unlinkSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
export default defineConfig({
 root:path('./web'),
 publicDir:path('./public'),
 plugins:[react(),{
  name:'drop-raw-model-bins',
  closeBundle(){
   const dir=path('./dist/models');
   try{
    for(const name of readdirSync(dir)){
     if(name.endsWith('.bin') && !name.endsWith('.gz')) unlinkSync(join(dir,name));
    }
   }catch{
    /* Local builds without models still succeed. */
   }
  },
 }],
 resolve:{alias:{'@':path('./')}},
 css:{postcss:{plugins:[tailwindcss()]}},
 server:{watch:{usePolling:true}},
 build:{outDir:path('./dist'),emptyOutDir:true},
});
