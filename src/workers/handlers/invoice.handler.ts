export async function invoiceHandler(data: {executionId: string,taskId: string}){
    console.log("Generating invoice...");
    console.log(data);

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        success: true
    };
}