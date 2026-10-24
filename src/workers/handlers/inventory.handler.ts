
export async function inventoryHandler(){
    console.log("Reserving inventory...");
    // Simulate inventory reservation
    await new Promise(resolve => setTimeout(resolve, 2000));
}
