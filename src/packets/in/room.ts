import { InPacketBase } from 'packets/in/packet'

import { InRoomCountdown } from 'packets/in/room/countdown'
import { InRoomNewRequest } from 'packets/in/room/fullrequest'
import { InRoomJoinRequest } from 'packets/in/room/joinrequest'
import { InRoomSetUserTeamRequest } from 'packets/in/room/setuserteamreq'
import { InRoomUpdateSettings } from 'packets/in/room/updatesettings'

enum InRoomType {
    NewRoomRequest = 0,
    JoinRoomRequest = 1,
    LeaveRoomRequest = 3,
    GameStartRequest = 5,
    UpdateSettings = 6,
    SetUserTeamRequest = 9,
    GameStartCountdownRequest = 19,
}

/**
 * incoming room packet
 * @class InRoomPacket
 */
export class InRoomPacket extends InPacketBase {
    public packetType: number

    public newRequest: InRoomNewRequest
    public joinRequest: InRoomJoinRequest
    public updateSettings: InRoomUpdateSettings
    public swapTeam: InRoomSetUserTeamRequest
    public countdown: InRoomCountdown

    /**
     * isNewRoomRequest
     */
    public isNewRoomRequest(): boolean {
        return this.packetType === InRoomType.NewRoomRequest
    }

    /**
     * isNewRoomRequest
     */
    public isJoinRoomRequest(): boolean {
        return this.packetType === InRoomType.JoinRoomRequest
    }

    /**
     * isLeaveRoomRequest
     */
    public isLeaveRoomRequest(): boolean {
        return this.packetType === InRoomType.LeaveRoomRequest
    }

    /**
     * isGameStartRequest
     */
    public isGameStartRequest(): boolean {
        return this.packetType === InRoomType.GameStartRequest
    }

    /**
     * isUpdateSettings
     */
    public isUpdateSettings(): boolean {
        return this.packetType === InRoomType.UpdateSettings
    }

    /**
     * isSwapTeam
     */
    public isSetUserTeamRequest(): boolean {
        return this.packetType === InRoomType.SetUserTeamRequest
    }

    /**
     * isGameStartCountdownRequest
     */
    public isGameStartCountdownRequest(): boolean {
        return this.packetType === InRoomType.GameStartCountdownRequest
    }

    /**
     * parses the packet's data
     */
    protected parse(): void {
        super.parse()
        this.packetType = this.readUInt8()

        switch (this.packetType) {
            case InRoomType.NewRoomRequest:
                this.newRequest = new InRoomNewRequest(this)
                break
            case InRoomType.JoinRoomRequest:
                this.joinRequest = new InRoomJoinRequest(this)
                break
            case InRoomType.LeaveRoomRequest:
            case InRoomType.GameStartRequest:
                break
            case InRoomType.UpdateSettings:
                this.updateSettings = new InRoomUpdateSettings(this)
                break
            case InRoomType.SetUserTeamRequest:
                this.swapTeam = new InRoomSetUserTeamRequest(this)
                break
            case InRoomType.GameStartCountdownRequest:
                this.countdown = new InRoomCountdown(this)
                break
            default:
                console.warn('InRoomPacket::parse: unknown inroompacket type ' + this.packetType)
        }
    }
}
