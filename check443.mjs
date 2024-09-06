import IPCIDR from 'ip-cidr'
import fs from "fs"
import axios from 'axios';
import {JSDOM} from 'jsdom'
import {limitConcurrentRequests} from "./module/axios.mjs" 
import {promisify} from "util"
const writeFileAsync = promisify(fs.writeFile);
const port = 443;
const expectedStatusCode = 400;
const htmlCheckContent = '<hr><center>cloudflare</center>';

let iplist=[]

async function checkIP(ip) {
    try {
        const url = `http://${ip}:${port}`;
        let response = await limitConcurrentRequests(url, { validateStatus: status => status === expectedStatusCode,timeout:9999});
		
        if (response.status === expectedStatusCode) {
		const dom = new JSDOM(response.data);
		const document = dom.window.document;
		const htmlContent = document.documentElement.innerHTML;
		
		if (htmlContent.includes(htmlCheckContent) && (response.headers.server==undefined||"cloudflare")) {
			console.log(`IP ${ip} 返回状态码为 ${expectedStatusCode}，并且包含指定HTML内容`);
			iplist.push(`${ip}/32\n`)
			try {
			    //await writeFileAsync('http400ips.json', JSON.stringify(iplist, null, 2));
			    await writeFileAsync('./data/ips.txt', iplist.join(''));
			} catch (error) {
			    console.error('写入文件时出错:', error);
			}
		    
		}	
        }
		
    } catch (error) {
			//console.error(`无法连接到 ${ip}:${port}`);
        
    }
}

function scanIPRange(ips){
	ips.forEach(ip=>{
		const cidr = new IPCIDR(ip);
		const IpArray=cidr.toArray()
		IpArray.forEach(checkIP)
	})
	
	//ips.forEach(checkIP)
}

function getIPSegmentsFromFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        reject(`Error reading the file: ${err}`);
        return;
      }

      const ipSegments = data.split(/\r?\n/).filter(line => {
        const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}\/(?:[0-9]|[1-2][0-9]|3[0-2])$/;
        return ipRegex.test(line);
      });

      resolve(ipSegments);
    });
  });
}

scanIPRange(await getIPSegmentsFromFile('./data/testips.txt'))