
const db = require('./firebase');


// Method To store Data 

// Data - it is mapping of name and value
// doc = It is the ref that tells is the parameter a commodity, statecode or disctrict code

// Store and Update Data both by this only
const storeData = async (data,doc)=>  {
try {
    const ref = db.collection('parameters').doc(doc); 
    await ref.set(data,{merge:true});
    
} catch (error) {
    console.log(error);    
}
}

const fetchData = async (docId) => {
    try {
    const ref = db.collection('parameters').doc(docId);
    const doc = await ref.get();
    if(!doc.exists){
    console.log(`${doc} does not exists`);
    throw `${doc} Does Not exisits`;
    }
    else{
        const data = doc.data();

        return data;

    }
        
    } catch (error) {
        console.log(error);
    }
}


module.exports = {storeData,fetchData};