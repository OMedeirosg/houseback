export const prettify = (arg:Record<string,any>)=>{
    return JSON.stringify(arg,null,2)
}