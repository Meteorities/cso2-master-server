import { ExtendedSocket } from 'extendedsocket'

import { User } from 'user/user'

import { ChannelManager } from 'channel/channelmanager'

import { InLoginPacket } from 'packets/in/login'
import { InUdpPacket } from 'packets/in/udp'
import { InVersionPacket } from 'packets/in/version'

import { OutUserInfoPacket } from 'packets/out/userinfo'
import { OutUserStartPacket } from 'packets/out/userstart'
import { OutVersionPacket } from 'packets/out/version'

/**
 * handles the user logic
 */
export class UserManager {
    private users: User[]
    private nextUserId: number

    constructor() {
        this.users = []
        this.nextUserId = 2
    }

    /**
     * called when we receive a login request packet
     * @param loginData the login packet's data
     * @param sourceSocket the client's socket
     * @param server the instance to the server
     */
    public onLoginPacket(loginData: Buffer, sourceSocket: ExtendedSocket,
                         channels: ChannelManager): boolean {
        const loginPacket: InLoginPacket = new InLoginPacket(loginData)
        console.log('trying to login as ' + loginPacket.gameUsername)

        const newUser: User = this.loginUser(loginPacket.gameUsername,
            loginPacket.password, sourceSocket)

        if (newUser == null) {
            console.warn('login failed for user ' + loginPacket.gameUsername
                + ' uuid: ' + sourceSocket.uuid)
            return false
        }

        const userStartReply: Buffer = new OutUserStartPacket(
            newUser.userId,
            loginPacket.gameUsername,
            loginPacket.gameUsername,
            sourceSocket.getSeq()).build()

        const userInfoReply: Buffer =
            new OutUserInfoPacket(sourceSocket.getSeq()).fullUserUpdate(newUser)

        const serverListReply: Buffer =
            channels.buildServerListPacket(sourceSocket.getSeq())

        sourceSocket.send(userStartReply)
        sourceSocket.send(userInfoReply)
        sourceSocket.send(serverListReply)

        return true
    }

    /**
     * receives the client's udp holepunch information
     * @param udpData the udp's packet data
     * @param sourceSocket the client's socket
     */
    public onUdpPacket(udpData: Buffer, sourceSocket: ExtendedSocket): boolean {
        const udpPacket: InUdpPacket = new InUdpPacket(udpData)
        console.log('udp data from ' + sourceSocket.uuid +
            ': ip: ' + udpPacket.ip + 'port:' + udpPacket.port)

        const user: User = this.getUserByUuid(sourceSocket.uuid)

        if (user == null) {
            console.warn('bad holepunch user, uuid: ' + sourceSocket.uuid)
            return false
        }

        if (udpPacket.isHeartbeat()) {
            console.log('UDP heartbeat from %s (%s)', user.userName, sourceSocket.uuid)
            return true
        }

        // cso2's client subtracts 0x8080000 from the ip (128 from the first two bytes)
        // this might bug out if one of the two bytes of the ip are less than 128
        // requires testing
        // UPDATE: the IPs no longer get subtracted?
        // const convertedIp = ip.toLong(udpPacket.ip)
        // convertedIp += 0x80800000

        user.externalIpAddress = udpPacket.ip
        user.port = udpPacket.port

        return true
    }

    public onVersionPacket(versionData: Buffer, sourceSocket: ExtendedSocket): boolean {
        const versionPacket: InVersionPacket = new InVersionPacket(versionData)
        console.log(sourceSocket.uuid + ' sent a version packet. clientHash: '
            + versionPacket.clientHash)

        // i think the client ignores the hash string
        const versionReply: Buffer = new OutVersionPacket(
            false, '6246015df9a7d1f7311f888e7e861f18', sourceSocket.getSeq()).build()

        sourceSocket.send(versionReply)

        return true
    }

    public loginUser(userName: string, password: string, sourceSocket: ExtendedSocket): User {
        return this.addUser(userName, sourceSocket)
    }

    public isUuidLoggedIn(uuid: string): boolean {
        return this.getUserByUuid(uuid) != null
    }

    public addUser(userName: string, socket: ExtendedSocket): User {
        const newUser: User = new User(socket, this.nextUserId++, userName)
        this.users.push(newUser)
        return newUser
    }

    public getUserById(userId: number): User {
        for (const user of this.users) {
            if (user.userId === userId) {
                return user
            }
        }
        return null
    }

    public getUserByUuid(uuid: string): User {
        for (const user of this.users) {
            if (user.socket.uuid === uuid) {
                return user
            }
        }
        return null
    }

    public removeUser(targetUser: User): void {
        this.cleanUpUser(targetUser)
        this.users.splice(this.users.indexOf(targetUser), 1)
    }

    public removeUserById(userId: number): void {
        for (const user of this.users) {
            if (user.userId === userId) {
                this.cleanUpUser(user)
                this.users.splice(this.users.indexOf(user), 1)
                return
            }
        }
    }

    public removeUserByUuid(uuid: string): void {
        for (const user of this.users) {
            if (user.socket.uuid === uuid) {
                this.cleanUpUser(user)
                this.users.splice(this.users.indexOf(user), 1)
                return
            }
        }
    }

    private cleanUpUser(user: User) {
        if (user.currentRoom) {
            user.currentRoom.removeUser(user)
        }
    }
}
