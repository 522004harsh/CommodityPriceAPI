const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const moment = require("moment");
const path = require("path");
const cors = require("cors");

const { storeData, fetchData } = require("./database/cloudstore");
const {
  getCommodityMapping,
  getStateMapping,
  getStateDistrictMapping,
  getMarkeMapping,
} = require("./scarpers/mapping");
const app = express();

// Below line will fetch the body data and give it in JSON format
app.use(cors());
app.use(express.json());
const validDateFormat = ["DD-MM-YYYY", "YYYY-MM-DD", "MM/DD/YYYY"];

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "simpleform.html"));
});

app.post("/api/send-market-mapping", async (req, res) => {
  try {
    const marketMapping = await getMarkeMapping();
    await storeData(marketMapping, "market");
    res.send("Success");
  } catch (error) {
    res.status(500).send(`Error fetching market ${error}`);
  }
});

app.post("/api/send-district-mapping", async (req, res) => {
  try {
    const districtMapping = await getStateDistrictMapping();
    await storeData(districtMapping, "district");
    res.send("Success");
  } catch (error) {
    res.status(500).send(`Error fetching district ${error}`);
  }
});

app.post("/api/send-state-mapping", async (req, res) => {
  try {
    const stateMap = await getStateMapping();
    await storeData(stateMap, "state");
    res.send("Success");
  } catch (error) {
    res.status(500).send(`Error fetching state ${error}`);
  }
});

app.post("/api/send-commodity-mapping", async (req, res) => {
  try {
    const commodityMap = await getCommodityMapping();
    await storeData(commodityMap, "commodity");
    res.send("Success");
  } catch (error) {
    res.status(500).send(`Error fetching commodity ${error}`);
  }
});

app.get("/api/get-market-data/", async (req, res) => {
  try {
    // Fetch Parameters from URL
    const {
      commodity,
      state = "0",
      district = "0",
      market = "0",
      fromDate,
      toDate,
    } = req.query;

    // Commodity is a required field
    if (!commodity) {
      return res.status(400).send("Commodity is a required field");
    }

    // Fetch Mapping from Database
    const commodityMap = await fetchData("commodity");
    const stateMap = await fetchData("state");
    const districtMap = await fetchData("district");
    const marketMap = await fetchData("market");

    // Fetching Index
    const commodityIndex = commodityMap[commodity.toLowerCase()];
    const stateIndex = stateMap[state.toLowerCase()];
    const districtIndex =
      district === "0"
        ? "0"
        : districtMap[state.toLowerCase()][district.toLowerCase()];
    const marketIndex = marketMap[market.toLowerCase()];
    const fromDateValue = fromDate
      ? moment(fromDate, validDateFormat, true).format("YYYY-MM-DD")
      : moment().subtract(7, "days").format("YYYY-MM-DD");
    const toDateValue = toDate
      ? moment(toDate, validDateFormat, true).format("YYYY-MM-DD")
      : moment().format("YYYY-MM-DD");

    const url = `https://agmarknet.gov.in/SearchCmmMkt.aspx?Tx_Commodity=${commodityIndex}&Tx_State=${stateIndex}&Tx_District=${districtIndex}&Tx_Market=${marketIndex}&DateFrom=${fromDateValue}&DateTo=${toDateValue}&Fr_Date=${fromDateValue}&To_Date=${toDateValue}&Tx_Trend=0&Tx_CommodityHead=${commodity}&Tx_StateHead=${state}&Tx_DistrictHead=${district}&Tx_MarketHead=--Select--`;

    // Fetch the HTML Code of the provided URL
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: "https://agmarknet.gov.in/",
        Connection: "keep-alive",
      },
    });

    // Load the HTML content into Cheerio
    const $ = cheerio.load(data);

    let marketData = [];
    let isEmpty;

    $("#cphBody_GridPriceData tr").each((index, element) => {
      if (index === 0) return; // Skip the header row

      let row = {};
      $(element)
        .find("td")
        .each((i, el) => {
          switch (i) {
            case 0:
              if ($(el).text().trim() === "No Data Found") {
                isEmpty = true;
                return false; // Break out of the loop
              } else {
                row["slNo"] = $(el).text().trim();
                isEmpty = false;
                break;
              }
            case 1:
              row["districtName"] = $(el).text().trim();
              break;
            case 2:
              row["marketName"] = $(el).text().trim();
              break;
            case 3:
              row["commodity"] = $(el).text().trim();
              break;
            case 4:
              row["variety"] = $(el).text().trim();
              break;
            case 5:
              row["grade"] = $(el).text().trim();
              break;
            case 6:
              row["minPrice"] = $(el).text().trim();
              break;
            case 7:
              row["maxPrice"] = $(el).text().trim();
              break;
            case 8:
              row["modalPrice"] = $(el).text().trim();
              break;
            case 9:
              row["priceDate"] = $(el).text().trim();
              break;
          }
        });
      marketData.push(row);
    });

    res.json({
      isEmpty,
      data: marketData,
    });
  } catch (error) {
    console.error("Error fetching market data:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    res.status(500).send(`Error fetching data ${error.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
