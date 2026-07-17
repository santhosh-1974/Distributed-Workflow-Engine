export async function paymentHandler(data: {executionId: string,taskId: string}){
    console.log("Charging payment...");
    console.log(data);

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        success: true
    };
}