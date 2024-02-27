import { AppDataSource } from "./data-source";
import { intializeDB } from "./db";
import { Helpers } from "./utils/helpers";

class Provision
{
    constructor()
    {
        intializeDB();
    }


    async startProvisioning() :Promise<void>
    {
        await this.provisionAdmin();
    }

    private async provisionAdmin() {
        //add checks that this user does not already exist
        const newUser = await AppDataSource
        .createQueryBuilder()
        .insert()
        .into('users')
        .values([
            {
                name: 'Admin',
                username: 'admin@system.local',
                signum: 'admin',
                password: await Helpers.hash('password'),
                active: 1,
                is_admin: 1,
                manager: null
            }
        ])
        .execute();
        if(!newUser)
        {
            console.error('Error in Admin provisioning');
        }
        else
        {
            console.log('Admin provisioning complete.');
            console.log(`Admin username/email: admin`);
            console.log(`Admin passowrd: passowrd`);
        }
    }
}

async function startProvisioning()
{
    const provision = new Provision();
    console.log('=============STARTING PROVISIONING================');
    await provision.startProvisioning();
    console.log('=============PROVISIONING COMPLETE================');
    process.exit(0);
}
startProvisioning();