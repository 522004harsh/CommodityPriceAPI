const axios = require('axios');
const cheerio = require('cheerio');

// This File contains scrapers for realtime mandi price from agmarket.gov.in website


const getCommodityMapping = async () => {
    try {
        const response = await axios.get('https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=137&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=30-Aug-2024&DateTo=30-Aug-2024&Fr_Date=30-Aug-2024&To_Date=30-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Ajwan&Tx_StateHead=--Select--&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--'); // Replace with the URL of the page containing the select element
        // cheerio help to use jquery like syntax and dom manipulation on response.data which is HTML content
        const $ = cheerio.load(response.data);
        let commodityMapping = {};

        $('#ddlCommodity option').each((index, element) => {
            const value = $(element).attr('value');
            const text = $(element).text();
            if (value && text && value !== '0') { // Skip the placeholder option
                commodityMapping[text.toLowerCase()] = value;
            }
        });
        return commodityMapping;
    } catch (error) {
        console.error('Error fetching commodity mapping:', error);
    }
}

const getStateMapping = async () => {
    const response = await axios.get('https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=137&Tx_State=0&Tx_District=0&Tx_Market=0&DateFrom=31-Aug-2024&DateTo=31-Aug-2024&Fr_Date=31-Aug-2024&To_Date=31-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Ajwan&Tx_StateHead=--Select--&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--'); 
    const $ = cheerio.load(response.data);
    const stateMapping = {};

    // Select the <select> element by its ID and iterate through its <option> elements
    $('#ddlState option').each((index, element) => {
        const value = $(element).attr('value');
        const text = $(element).text();
        if (value && text && value !== '0') { // Skip the placeholder option
            stateMapping[text.toLowerCase()] = value;
        }
    });

    return stateMapping;
}
const getDistrictMapping = async (stateCode) =>{

    const response = await axios.get(`https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=15&Tx_State=${stateCode}&Tx_District=0&Tx_Market=0&DateFrom=31-Aug-2024&DateTo=31-Aug-2024&Fr_Date=31-Aug-2024&To_Date=31-Aug-2024&Tx_Trend=0&Tx_CommodityHead=Cotton&Tx_StateHead=Gujarat&Tx_DistrictHead=--Select--&Tx_MarketHead=--Select--`);
    const $ = cheerio.load(response.data);
    const districtMapping = {};

    $('#ddlDistrict option').each((index, element) => {
        const value = $(element).attr('value');
        const text = $(element).text();
        if (value && text && value !== '0') { // Skip the placeholder option
            districtMapping[text.toLowerCase()] = value;
        }
    });

    return districtMapping;
}


const getStateDistrictMapping = async () => {
    try {
        const stateDistrictMapping = {};
        const stateMapping = await getStateMapping(); // Function to fetch all states and their codes
        
        for (const [stateName, stateCode] of Object.entries(stateMapping)) {
            const districtMapping = await getDistrictMapping(stateCode);
            stateDistrictMapping[stateName] = districtMapping;
        }
        return stateDistrictMapping;
    } catch (error) {
        console.error('Error storing state and district mapping:', error);
    }
}

const getMarkeMapping = async () => {
    try {
        const response = await axios.get('https://agmarknet.gov.in/');
        const $ = cheerio.load(response.data);
        const marketYardMapping = {};

        $('#ddlMarket option').each((index, element) => {
            const value = $(element).attr('value').trim();
            const text = $(element).text().trim();
            // Skip placeholder and "Z[State Total]" options
            if (value && text && value !== '0' && !text.startsWith('Z[')) { 
                marketYardMapping[text.toLowerCase()] = value;
            }
        });
        return marketYardMapping;
    } catch (error) {
        console.error('Error fetching market yard mapping:', error);
    }
}







module.exports = {getCommodityMapping,getStateMapping,getStateDistrictMapping,getMarkeMapping};