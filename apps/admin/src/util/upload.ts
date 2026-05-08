// import ExcelJS from 'exceljs'
// export const uploadExcel = async (file: File) => {
//     const arrayBuffer = await file.arrayBuffer()

//     const tableData: any = [];
//     const workbook = new ExcelJS.Workbook();
//     try {
//         await workbook.xlsx.load(arrayBuffer);
//         // 获取第一个工作表
//         const worksheet = workbook.getWorksheet(1);

//         // 读取工作表中的数据
//         worksheet?.eachRow({includeEmpty: true}, (row, rowNumber) => {
//             console.log(`Row ${rowNumber}:`, row.values);
//             // 去掉表头
//             if (rowNumber > 1) {
//                 tableData.push({
//                     key: rowNumber.toString(),
                  
//                     app: row.values[1].trim(),
                  
//                     name: row.values[2].trim(),
                    
//                     works: row.values[3].trim()
//                 })
//             }
//         });

//     } catch (error) {
//         console.error('Error loading workbook:', error);
//     }

//     console.log(tableData);
//     return tableData;
// }
