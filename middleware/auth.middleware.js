
import jwt from "jsonwebtoken"

export const isLoggedIn = async (req, res, next) => {

    // get token from cookies
    // try-catch isliye lagaya hai yaha kyoki uncertainity hai ki cookies ka access hai ya nahi, ya cookies hai bhi ya nahi
    try {
        console.log(req.cookies); // debugging step

        // ab saare cookies mein se ek cookie chahiye (i.e., token)
        let token = req.cookies.token || "" // or we can also use optional chaining (let token = req.cookies?.token), ki agar cookies ke andar token hai toh hamein de doh

        console.log('Token found', token ? "Yes" : "No") // using ternary operator

        // check the token
        if(!token){
            console.log("No Token")
            return res.status(401).json({
                success: false,
                message: "Authentication failed"
            })
        }

        // NOTE:- waise toh try-catch zaroori nahi hai yaha, lekin aise bhi code likhte hai bahot log ki niche waale decoded ke code ko try-catch mein likhe

        // extract data from the token, so for this we will use JWT
        // ab jis key se encrypt kara tha, usi key se decrypt karunga
        const decoded = jwt.verify(token, process.env.JWT_SECRET) // JWT_SECRET same hona chahiye, tabhi toh decrypt hoga
        console.log("Decoded data:", decoded) // It is an object
    
        req.user = decoded
    
        next() 

    } catch (error) {
        console.log("Auth middleware failure")
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
        // next() // yeh grade out ho jaa rha hai kyoki return ho gaya hai
    }   

    // next() // ab yeh isliye likha yaha, ki maan lo hamne try-catch mein kuch nahi kiya, toh aap controller se aage toh jaoge na, warna phasey hi reh jaoge

    /*
        Haan 👌 mujhe samajh aa gaya tum kya kehna chahte ho.
        Sir ne jo reason bataya hoga uska matlab yeh tha ki:

        👉 Agar tum try–catch ke andar kahin bhi return nahi karte aur error handle nahi karte, tab control middleware ke andar hi atak jaayega aur request next controller tak pahunch hi nahi paayegi.
        Isliye kuch log last mein ek next() likh dete hain safe-side ke liye.

        ⚠️ Lekin tumhare code mein situation alag hai:

        Tumne no token case mein return res.status(...) kar diya → control ruk gaya.

        Tumne JWT verify success case mein next() call kar diya → controller pe chala gaya.

        Tumne catch block mein bhi return res.status(...) kar diya → control ruk gaya.

        Matlab har ek path already covered hai.
        Toh ab last wala next() redundant hai, aur actually problem karega (double response wali error).

        ✅ Sir ka point sahi hai general explanation ke liye,
        lekin tumhare is code mein last wala next() ki koi zarurat nahi hai.

        👉 Simple version (best practice):

        Success path → next()

        Failure path → return res...

        Aur middleware ke end mein extra next() kabhi mat likhna.
    */

    // lekin isse response jaate hi jaa rha hai

    // return res.status(400).json({}) // yeh bhi issue hai

    // matlab kul mila ke baat yeh hai ki, hamein response ek baar se zyada nahi phekna
    
} 