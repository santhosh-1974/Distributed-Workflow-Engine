

export async function paymentHandler() {
    
    console.log("Charging payment...");
    // Simulate payment gateway
    await new Promise(resolve => setTimeout(resolve, 2000));

}