const otpService = require('../services/otp-service')
const hashService = require('../services/hash-service')
const userService = require('../services/user-service')
const tokenService = require('../services/token-service')
const UserDto = require('../dtos/user-dto')


class AuthController{

    async sendOtp(req,res){

        const {phone} = req.body;
        if (!phone) {
            res.status(400).json({
                message:"Phone field is required"
            })
        }

        const otp = await otpService.generateOtp();

        //Hash otp {ttl: timetoLeave}
        const ttl = 1000*60*2; //2 min
        const expires = Date.now()+ttl;
        const data = `${phone}.${otp}.${expires}`;
        const hash = hashService.hashOtp(data)

        try{
            //await otpService.sendBySMS(phone,otp)
            console.log(otp)
            return res.json({
                hash:`${hash}.${expires}`,
                phone:phone,
                otp,
            })
        }
        catch(err){
            console.log(err);
            res.status(500).json({
                message:"Error in otp sending"
            })

        }



        
    }
    async verifyOtp(req,res){
        //Logic
        const {otp,hash,phone} = req.body;
        if (!otp || !hash || !phone) {
            res.status(400).json({
                message:"All fields are required"
            })
            
        }
        const [hashedOtp,expires] = hash.split('.');
        if (Date.now() > +expires) {
            res.status(400).json({
                message:"Otp expired"
            })
        }

        const data = `${phone}.${otp}.${expires}`;

        const isValid = otpService.verifyOtp(hashedOtp,data)

        if (!isValid) {
            res.status(400).json({
                message:"Inavlid otp"
            })
        }

        let user;
        
        try{
            user = await userService.findUser({
                phone
            })
            if(!user){
                user = await userService.createUser({
                    phone
                })
            }
        }catch(err){
            console.log(err)
            res.status(500).json({
                message:"Db error"
            })
            
        }
        
        //let accessToken;

        //jwtokens generate
        const {accessToken,refreshToken} =tokenService.generateTokens({
            _id:user._id,
            activated:false
        });

        //save tokens
        await tokenService.storeRefreshToken(refreshToken,user._id)

        res.cookie('refreshToken',refreshToken,{
            maxAge: 1000*60*60*24*30,//30 days
            httpOnly: true,//Security  js cant read it
        })

        res.cookie('accessToken',accessToken,{
            maxAge: 1000*60*60*24*30,//30 days
            httpOnly: true,//Security  js cant read it
        })

        const userDto = new UserDto(user);

        res.json({
            user:userDto,
            auth:true,
        })
        



    }
    async refresh(req,res){
        //get refresh tokenfrom  cookie
        //check if token is valid
        //check if token is in db
        //Genreat new token {access as well as refresh}
        //put in cookie
        //send res

        //get refresh tokenfrom  cookie
        const {refreshToken:refreshTokenFromCookie} = req.cookies;
        //check if token is valid
        let userData;
        try{
            userData =  await tokenService.verifyRefreshToken(refreshTokenFromCookie)

        }catch(err){
            return res.status(401).json({
                message:'Invalid token'
            })

        }

        //check if token is in db
        try{
            const token =   tokenService.findRefreshToken(userData._id,refreshTokenFromCookie);
            if(!token){
                return res.status(401).json({
                    message:'Invalid token'
                })
                
            }
        }catch(err){
            return res.status(500).json({
                message:'DB error'
            })
        }

        //check if valid users
        const user = await userService.findUser({ _id: userData._id });
        if (!user) {
            return res.status(404).json({ message: 'No user' });
        }

        // Generate new tokens
        const { refreshToken, accessToken } = tokenService.generateTokens({
            _id: userData._id,
        });

        // Update refresh token
        try {
            await tokenService.updateRefreshToken(userData._id, refreshToken);
        } catch (err) {
            return res.status(500).json({ message: 'Internal error' });
        }

        // put in cookie
        res.cookie('refreshToken', refreshToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
        });

        res.cookie('accessToken', accessToken, {
            maxAge: 1000 * 60 * 60 * 24 * 30,
            httpOnly: true,
        });
        // response
        const userDto = new UserDto(user);
        res.json({ user: userDto, auth: true });

    }
    async logout(req,res){
        const {refreshToken} = req.cookies;
        // delete refresh token from db
        // delete cookie
        await tokenService.removeToken(refreshToken);
        res.clearCookie('refreshToken');
        res.json({
            user:null,
            auth:false,
        })

    }
}

module.exports = new AuthController();