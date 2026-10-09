import {solveMasonry} from '../masonry/solver';
self.onmessage=({data})=>{try{self.postMessage({result:solveMasonry(data)});}catch(error){self.postMessage({error:error instanceof Error?error.message:String(error)});}};
