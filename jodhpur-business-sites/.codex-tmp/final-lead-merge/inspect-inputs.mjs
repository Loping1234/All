import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const files = [
  {
    label: "verification-download",
    path: "C:/Users/PRANAY/Downloads/businessname-category-searchedquery-officialwebsit.csv",
    type: "csv",
  },
  {
    label: "verified-geoapify",
    path: "../../data/processed/jodhpur_no_website_verified.csv",
    type: "csv",
  },
  {
    label: "download-xlsx",
    path: "C:/Users/PRANAY/Downloads/jodhpur_no_website.csv.xlsx",
    type: "xlsx",
  },
];

for (const file of files) {
  const workbook = file.type === "csv"
    ? await Workbook.fromCSV(await fs.readFile(file.path, "utf8"), { sheetName: "Data" })
    : await SpreadsheetFile.importXlsx(await FileBlob.load(file.path));
  const overview = await workbook.inspect({
    kind: "sheet,region",
    maxChars: 14000,
    tableMaxRows: 20,
    tableMaxCols: 30,
    tableMaxCellChars: 300,
  });
  console.log(`--- ${file.label} ---`);
  console.log(overview.ndjson);
}
