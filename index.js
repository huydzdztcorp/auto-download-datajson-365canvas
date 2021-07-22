const fs = require('fs')
const download = require('download');
const { v4: uuidv4 } = require('uuid');

const startDownload = async () => {
    try {  
        const data = fs.readFileSync('links.txt', 'utf8');
        const links = data.toString() 
        const arr = links.split("\r\n")

        await Promise.all(arr.map(async (link) => {
            await downloadAllFileFromLink(link)
        }))
        
    } catch(e) {
        console.log(e);
    }
}

const downloadAllFileFromLink = async (link) =>{
    console.log("start crawl " + link)
    try {
        const temp = link.split("/");
        const path = temp[temp.length - 1]
    
        const response = await downloadFile(`${link}/data.json` , path , "data.json");
    
        if(response.message === "success"){
            const filePathJson = response.filePath
    
            const data = await fs.readFileSync(filePathJson, 'utf8');
            const jsonData = JSON.parse(data)
    
            const { children } = jsonData

            const newChildren = children.map((child) => {
                return {
                    ...child,
                    id:uuidv4()
                }
            })

            fs.writeFile (filePathJson, JSON.stringify({
                ...jsonData,
                children: newChildren
            }), function(err) {
                if (err) throw err;
                }
            );
    
            await Promise.all(children.map(async (child) => {
                if(child.image){
                    const arr = child.image.split("/")
                    await downloadFile(`${link}/${child.image}` , `${path}/${arr.shift()}` , arr.pop());
                }
                if(child.preview){
                    const arr = child.image.split("/")
                    await downloadFile(`${link}/${child.preview}` , `${path}/${arr.shift()}` , arr.pop());
                }
                if(child.text && child.text.font && child.text.font.path){
                    const arr = child.text.font.path.split("/")
                    await downloadFile(`${link}/${child.text.font.path}` , `${path}/${arr.shift()}` , arr.pop());
                }
            }))
        }else{
            throw new Error("Error")
        }
        console.log("crawl success : " + link)

    } catch (error) {
        console.log("crawl fail : " + link)
        console.log(error)

    }
  
}

const downloadFile = async (link , path , fileName) =>{
    const filePath = `${__dirname}/themes/${path}`; 
    
    const res = await download(link,filePath).catch((e) => {
        return{
            message:"error"
        }
    })

    return {
        message:"success",
        filePath:`${filePath}/${fileName}`,
    }
}


startDownload()
