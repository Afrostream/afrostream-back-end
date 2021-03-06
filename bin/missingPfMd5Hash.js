#!/usr/bin/env node

// select e from (select distinct "encodingId" as "e" from "Videos" where "encodingId" is not null and "pfMd5Hash" is null) as foo order by length("e")
var encodingIdList = [
   "fa9c3421cd35efc1"
  ,"b165ecbba481ed35"
  ,"3c99944c96d4e238"
  ,"4d66ede335a3ddba"
  ,"3a3f46f814c44b74"
  ,"4d412a5d229c3285"
  ,"795866ac7f163e1a"
  ,"b50b9465af403984"
  ,"cdf3990451593e76"
  ,"5890bd647f0734de"
  ,"e183edcff2637a99"
  ,"5637d646afe514e1"
  ,"0d8a72ab42eac098"
  ,"6e350d7e9d344a65"
  ,"60f794d152aa9aa9"
  ,"3f6d53c93686d14a"
  ,"d3cd983315f1cd58"
  ,"539ea81e92d7b651"
  ,"1de2af809d70935c"
  ,"b4687290e10162b1"
  ,"f3574a6faba35a5b"
  ,"8633ff123c1bd840"
  ,"c98f9889207c9b56"
  ,"21e7f3cf4ddd4a98"
  ,"29ff1612ddb24570"
  ,"180c5fd0ba9ffea5"
  ,"11156641eb71ca7d"
  ,"72c570650fc0a95a"
  ,"98a3776d81901d34"
  ,"60fae0014be1f989"
  ,"644b4119b656d65f"
  ,"c65aa147b5d0cfef"
  ,"62007351cf9d2d7f"
  ,"b000fa9644ec9f38"
  ,"3e4ea860b4eb4c31"
  ,"21e565e417bd0e28"
  ,"bf632a412037373d"
  ,"237e30f5703d5911"
  ,"9b14b2c2ac92cee3"
  ,"3cc99b1969aa7c78"
  ,"d98d29e639600962"
  ,"e4065eb820516353"
  ,"089b29c514c10c00"
  ,"7c442f0b63424003"
  ,"c0fde7997427ca6b"
  ,"e1e433cb1e338fb6"
  ,"e1601c4cab6bb247"
  ,"9ba871562c24a125"
  ,"beb033f72cbac4b4"
  ,"3d4d6ad617eb4d96"
  ,"3913874d09184ac5"
  ,"22eaa2ff233b464e"
  ,"a43da27d2eeeeb1b"
  ,"c0e48b7493d8f7c7"
  ,"21878361f789fd29"
  ,"1db198bd84702689"
  ,"d4ef1b9bc6ae8e07"
  ,"d7efbbdb83c6739b"
  ,"cf26afe7aa84cc8c"
  ,"45cd6dd7c01d7339"
  ,"39b339bbddd84bc2"
  ,"a8992d6133eba93e"
  ,"b25552bf920b82c5"
  ,"3ab8b66b8b10b1fa"
  ,"6a38aea96c56b120"
  ,"920bcb65ff6ff2c8"
  ,"3e09d76836dd8dfe"
  ,"4ef709c119cab66b"
  ,"fee443d84e16d92c"
  ,"4ae493efafb78d8d"
  ,"028dfd094644d6dc"
  ,"42ce5b1edeb4f685"
  ,"1e721b47213ed7a2"
  ,"7f77945c388ad6b2"
  ,"a2c9ebb2e2bfcf7b"
  ,"0fdc6369d6e7fe57"
  ,"46e01ddd7519fd34"
  ,"b783eb27eaaf736c"
  ,"47d70a1ed83785f2"
  ,"42d1218dfbe75202"
  ,"c3a3774d972bbd07"
  ,"bd2d501caeb18b14"
  ,"4bdf1643ce491843"
  ,"efbd4c7a7ad41d22"
  ,"2b398bc245eb5764"
  ,"5c5d2be74efbdc00"
  ,"6cdd1e68a9b8ecd1"
  ,"eed309b43db223ef"
  ,"79760f6b7fcd93f4"
  ,"9fd976a90e63b686"
  ,"5dfb1725669bf0e5"
  ,"98575fca123a09f0"
  ,"b6f69783a5a4efac"
  ,"02535e2399a926a8"
  ,"491fcec158c95bde"
  ,"b7d86b179eb47d89"
  ,"fa8a483808c032ca"
  ,"f4565cd07fc24d41"
  ,"27099f462d623be9"
  ,"d67265a789698ad0"
  ,"1d3316cc3095284e"
  ,"1beac89efbc0f6e2"
  ,"7723fe498c2909c3"
  ,"c81746107e7c89a8"
  ,"ffdca4fae1849c99"
  ,"b7c7a0f735d7c6ab"
  ,"ac16f55e897b3eb1"
  ,"902201fbf1087ffc"
  ,"cea8a86d3681f4a0"
  ,"055ef13facc3e972"
  ,"e508b188f72e858f"
  ,"7f05e0fad1c33ba7"
  ,"0220acc39afe3f33"
  ,"55dc3d3e2ab27604"
  ,"a8c79718cd01b641"
  ,"3e017eb78c81d0ec"
  ,"0128281a1bab8bf0"
  ,"874c9857ad1394ad"
  ,"53a7f98e6287cad3"
  ,"bbac53e60893fa6c"
  ,"6a53d134e4a9c378"
  ,"ee1800a482557155"
  ,"c561f18c45fcd00d"
  ,"8bb5e12b236accea"
  ,"b915dccf01eb4d26"
  ,"5b339b4c3480f41f"
  ,"b23628b16662a2de"
  ,"6122c65593ffea3c"
  ,"a7b1dc843f59e198"
  ,"1292d9e5e9212e56"
  ,"6be6bfb876a3700e"
  ,"5a9c5dcc1ab9df54"
  ,"4269d5fac2cb6c83"
  ,"45ccf7facfc702ca"
  ,"70caffaa9fa9c4a0"
  ,"578d71fdff675a52"
  ,"34d826b3fc9d1568"
  ,"57874c51c029203b"
  ,"1149062f095c71cb"
  ,"a71a1cfb55e67e31"
  ,"cf10cb1ddc825714"
  ,"a10437a68acf9af3"
  ,"ff5ca2694f30cd60"
  ,"730f35bab6371914"
  ,"69b463b5c0c7fac4"
  ,"339014884f809971"
  ,"8c8cf93b94becc36"
  ,"1f43faee5dfa4b1c"
  ,"1150e30f874167ef"
  ,"fe9db4f079d58dcd"
  ,"288e494fe50d2355"
  ,"b57724bdf19bc097"
  ,"eca25db1b4c38072"
  ,"386e3c5a1375faa1"
  ,"1b1a80e0311aefe3"
  ,"56f74fb0c568c545"
  ,"2bca37907319deed"
  ,"bdca06140721324e"
  ,"2dbb03340c39b43b"
  ,"e2611d9d5253d2f3"
  ,"6092063971f3b10f"
  ,"e4511e29b29bad2f"
  ,"1fc85b86-c4e7-482c-b51f-daed0f0713de"
  ,"befabe79-7300-4c9a-9ebf-44f81347ebe5"
  ,"ff1f0f68-0182-4469-a984-665bbd6ff8d2"
  ,"b383fdc1-1b3b-4031-807e-81954f840aa5"
  ,"d44f6840-5eeb-414c-97ce-506f801e8d07"
  ,"b135bf98-594e-4317-917c-2f063e2c12a5"
  ,"83e71c2f-74e9-4455-a222-629993fd6b15"
  ,"89e04ba5-32ca-448c-84d0-8f16473ae295"
  ,"0501783d-5d16-44f8-8899-1dac56b06028"
  ,"672b0197-071c-4549-bd05-c437c7084e3c"
  ,"f9831d79-cfb2-4836-92ec-427d809cbbbb"
  ,"6a247a74-3996-422f-95fa-e93d7fd8512a"
  ,"cb730936-215e-4ff7-96cb-7c3b3d45a0fa"
  ,"8e5dad28-7350-42fb-a552-74e243d24943"
  ,"c3d16f8b-ef1f-4afa-912c-0792d25f8bea"
  ,"41b832e5-6757-4ad2-9bb5-c723b4c87e24"
  ,"29ee59bf-1d59-4a7d-a792-dbd2e4818397"
  ,"4207ba46-18b8-4e40-9e51-0812398a91f4"
  ,"fbd387f1-0ae8-4e1c-b32d-1e9542bfcc3a"
  ,"2eb16b50-84b5-48e9-95ee-77042cb878f3"
  ,"29922e90-c19b-4e1b-848b-bb7e0d2887a0"
  ,"2aa0d9ae-0c33-400d-be75-891b70d4ee3a"
  ,"533f1932-fcc2-452b-a628-9a9b20fd4d49"
  ,"78f967cc-c1c3-466e-b4e6-25084d9ddc2e"
  ,"058a8db3-8420-4f8c-8ec6-40b0bb06adda"
  ,"258f602c-54c1-4538-af79-a105ea587ee9"
  ,"13bd09d5-6226-4e16-b60a-cb1e02e5ca80"
  ,"9922c95f-a8a5-46db-954d-f2377f1992ae"
  ,"6cfaf1e3-a090-4a51-9e70-bbddb4251b7b"
  ,"6fc56b0b-db84-49b5-91cf-c9f2fc5080c4"
  ,"da4b0f37-fab4-4b90-a93d-ce9238e1c2f9"
  ,"21a4e4d8-8d31-4cb9-8785-8cfeee045b4b"
  ,"132f6182-fe87-4cbc-b240-4f5926b92db8"
];

var Q = require('q');
var request = require('request');

// try to know the pfMd5Hash
encodingIdList.reduce(function (p, c) {
  //if (i > 5) return p;
  return p.then(function () {
    return Q.nfcall(request, { json: true, url: 'http://p-afsmsch-001.afrostream.tv:4000/api/contents?uuid=' + c });
  }).then(function (data) {
    var body = data[1];
    if (!Array.isArray(body)) {
      console.log('-- ERROR: "'+c+'": data = ', JSON.stringify(data));
    } else if (body.length) {
      if (body[0].md5Hash) {
        //console.log('"'+c+'";"'+body[0].md5Hash+'"');
        console.log('UPDATE "Videos" SET "pfMd5Hash" = \'' + body[0].md5Hash + '\' WHERE "encodingId" = \'' + c + '\';');
      }
    } else {
      console.log('-- ERROR: "'+c+'": unknown encodingId in PF ?');
    }
    //console.log('response body', body);
  }, function (err) { console.error(err.message); });
}, Q());
