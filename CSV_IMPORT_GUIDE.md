# CSV Import Guide - Quick & Easy!

## ✅ CSV Import is Ready to Use!

I've built a simple CSV import feature so you can quickly import your Square customer data without dealing with OAuth or API tokens.

## 🚀 How to Import Your Square CSV

### Step 1: Export from Square (Already Done!)

You already have the file: `export-20251128-184346.csv`

### Step 2: Start the Dev Server

```bash
npm run dev
```

### Step 3: Import in the Browser

1. Go to http://localhost:3000/clients
2. Click **"Import CSV"** button
3. Select your CSV file (`export-20251128-184346.csv`)
4. Click **"Import CSV"**
5. Wait a few seconds...
6. Done! All your customers are now in the app!

## 📊 What Gets Imported

The CSV parser extracts:
- ✅ First Name & Last Name
- ✅ Email Address
- ✅ Phone Number
- ✅ Company Name
- ✅ Full Address (Street, City, State, Zip)
- ✅ Notes/Memo
- ✅ Square Customer ID (for reference)

## 🎯 Features

### Smart Data Cleaning:
- Phone numbers cleaned (removes quotes and + signs)
- Empty fields handled gracefully
- Skips rows without names
- Prevents duplicate imports

### Import Results:
- Shows total customers found in CSV
- Shows how many successfully imported
- Lists any errors encountered
- Auto-refreshes client list when done

## 📝 CSV Format Supported

The import works with Square's standard customer export CSV format:

```
Reference ID, First Name, Last Name, Email Address, Phone Number, ...
```

Headers must match Square's export format (which your file already has!).

## 🔧 Troubleshooting

### "No valid customers found"
- Check that CSV has headers in first row
- Make sure customers have at least First Name and Last Name

### Import shows errors
- Duplicate Square Customer IDs will be skipped
- Missing required fields (first/last name) will be skipped
- Other customers will still import successfully

### File won't upload
- Make sure it's a .csv file
- File should be under 10MB
- Try saving a copy if original doesn't work

## 🎨 UI Location

The **"Import CSV"** button is in the clients page header, right next to "Add Client".

## 💡 Tips

1. **First Time Import:** Import your full CSV to get all customers
2. **Updates:** You can re-import to update existing customers (matches by Square Customer ID)
3. **Backup First:** The backup system will save your data automatically
4. **Check Results:** The import shows exactly what was imported and any errors

## 🚀 Next Steps After Import

Once your customers are imported:
1. ✅ Search for clients by name, email, or company
2. ✅ Edit client information
3. ✅ Add new clients manually
4. ✅ Delete clients you don't need
5. ✅ Export backup of all data

---

**Ready to try it?** Just run `npm run dev` and click "Import CSV" in the clients page!

Your CSV has **real customer data** ready to import right now.
