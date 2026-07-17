export async function emailHandler(data: { executionId: string,taskId: string}){
    console.log("Sending email...");
    console.log(data);

    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
        success: true
    };
}