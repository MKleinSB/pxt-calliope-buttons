/**
 * User interaction on buttons
 */
const enum TouchButtonEvent {
//    //% block="click"
//    Click = 3 /* DAL.MICROBIT_BUTTON_EVT_CLICK */,
    //% block="long click"
    LongClick = 4 /* DAL.MICROBIT_BUTTON_EVT_LONG_CLICK */,
    //% block="up"
    Up = 2 /* DAL.MICROBIT_BUTTON_EVT_UP */,
    //% block="down"
    Down = 1, /* DAL.MICROBIT_BUTTON_EVT_DOWN */
    //% block="hold"
    Hold = 5 /* DAL.MICROBIT_BUTTON_EVT_HOLD */
};

/**
 * Capacitive button support for Calliope mini
 */

//% weight=5 color=#0fbc11 icon="\uf0a6" block="Touch"
//% groups='["On Start","Buttons"]'

namespace Touch {
    const CAPACITIVE_TOUCH_ID = 6543;
    const CALIBRATION_SAMPLES = 8;
    const CAP_SAMPLES = 4;
    const CALIBRATION_CONSTANT_OFFSET = 4;
    const SIGMA_THRESH_MAX = 5;
    const SIGMA_THRESH_HI = 4;
    const SIGMA_THRESH_LO = 2;
    const SIGMA_THRESH_MIN = 0;
    const BUTTON_HOLD_TIME = 1500;

    const STATE = 1
    const STATE_HOLD_TRIGGERED = 1 << 1
    //const STATE_CLICK = 1 << 2
    //const STATE_LONG_CLICK = 1 << 3
    const STATE_INITIALIZED = 1 << 4
    const STATE_CALIBRATION_REQUIRED = 1 << 5
    const STATE_CALIBRATION_INPROGRESS = 1 << 6

    /**
     * A self capacitive button mounted on micro:bit pins.
     */
    //% fixedInstances
    export class CapacitiveButton {
        private id: number;
        private pin: AnalogInOutPin;
        public threshold: number;
        private lastReading: number;
        private status: number;
        private sigma: number;
        private downStartTime: number;

        constructor(id: number, pin: AnalogInOutPin) {
            this.id = id;
            this.pin = pin;
            this.threshold = 1023;
            this.sigma = 0;
            this.status = 0;
            this.lastReading = -1;
            this.downStartTime = 0;
        }

        private read() {
            let reading = 0;
            for (let i = 0; i < CAP_SAMPLES; ++i) {
                this.pin.digitalWrite(true);
                control.waitMicros(5)
                reading += this.pin.analogRead()
            }
            this.lastReading = Math.idiv(reading, CAP_SAMPLES);
            this.pin.digitalWrite(false);
            return this.lastReading;
        }

        private init() {
            if (!this.status) {
                this.status |= STATE_INITIALIZED | STATE_CALIBRATION_REQUIRED;
                control.inBackground(() => this.idleWorker());
            }

            // calibrate if needed
            if (this.status & STATE_CALIBRATION_REQUIRED) {
                this.status &= ~STATE_CALIBRATION_REQUIRED;
                this.status |= STATE_CALIBRATION_INPROGRESS;
                // Record the highest value measured. This is our baseline.
                this.threshold = 0;
                for (let i = 0; i < CALIBRATION_SAMPLES; ++i) {
                    basic.pause(1);
                    const reading = this.read();
                    this.threshold = Math.max(this.threshold, reading);
                }

                // We've completed calibration, returnt to normal mode of operation.
                this.threshold += CALIBRATION_CONSTANT_OFFSET;
                this.status &= ~STATE_CALIBRATION_INPROGRESS;
            }
        }

        private idleWorker() {
            while (true) {
                // don't interfere with calibration
                if (!(this.status & (STATE_CALIBRATION_INPROGRESS | STATE_CALIBRATION_REQUIRED)))
                    this.periodicCallback();
                basic.pause(20)
            }
        }

        private periodicCallback() {
            //
            // If the pin is pulled low (touched), increment our culumative counter.
            // otherwise, decrement it. We're essentially building a lazy follower here.
            // This makes the output debounced for buttons, and desensitizes touch sensors
            // (particularly in environments where there is mains noise!)
            //
            this.read();
            if (this.isActive()) {
                if (this.sigma < SIGMA_THRESH_MAX)
                    this.sigma++;
            }
            else {
                if (this.sigma > SIGMA_THRESH_MIN)
                    this.sigma--;
            }

            // Check to see if we have off->on state change.
            if (this.sigma >= SIGMA_THRESH_HI
                && !(this.status & STATE)) {
                // Record we have a state change, and raise an event.
                this.status |= STATE;
                control.raiseEvent(this.id, TouchButtonEvent.Down);

                //Record the time the button was pressed.
                this.downStartTime = input.runningTime();
            }
            // Check to see if we have on->off state change.
            else if (this.sigma <= SIGMA_THRESH_LO
                && (this.status & STATE)) {
                this.status &= ~STATE;
                control.raiseEvent(this.id, TouchButtonEvent.Up);

                //determine if this is a long click or a normal click and send event
                const elapsed = input.runningTime() - this.downStartTime;
                if (elapsed >= DAL.MICROBIT_BUTTON_EVT_LONG_CLICK)
                    control.raiseEvent(this.id, TouchButtonEvent.LongClick);
//                else
//                    control.raiseEvent(this.id, TouchButtonEvent.Click);
            }
            //if button is pressed and the hold triggered event state is not triggered AND we are greater than the button debounce value
            else if ((this.status & STATE)
                && !(this.status & STATE_HOLD_TRIGGERED)
                && (input.runningTime() - this.downStartTime) >= BUTTON_HOLD_TIME) {
                //set the hold triggered event flag
                this.status |= STATE_HOLD_TRIGGERED;
                //fire hold event
                control.raiseEvent(this.id, TouchButtonEvent.Hold);
            }
        }

        /**
         * Calibrate
         */
        //% blockId=touchcalibrate block="calibrate touchpin %button"
        //% group="On Start"
        calibrate() {
            this.status |= STATE_CALIBRATION_REQUIRED;
            this.init();
        }
 
        /**
         * Registers an button event
         */
        //% blockId=touchonevent block="on %button $event"
        //% group="Buttons" weight=80
        onEvent(event: TouchButtonEvent, handler: () => void) {
            this.init();
            control.onEvent(this.id, event, handler);
        }

        /**
          * Determines if the button is being pressed
          */
        //% blockId=touchistouched block="%button berührt" weight=70
        isTouched(): boolean {
            this.init();
            return this.isActive();
        }

        /**
        * Gets the value of the capacitive pin
        */
        //% blockId=touchvalue block="%button value" weight=60

        value() {
            this.init();
            return this.lastReading | 0;
        }


        private isActive(): boolean {
            return this.threshold <= this.lastReading;
        }



    }

    // irgendwie sind die Deklarationen in core/pinscompat.ts nicht optimal, deswegen werden sie hier
    // von mir einfach umdeklariert

    const P1: PwmPin = new MicrobitPin(DigitalPin.P1);
    const P2: PwmPin = new MicrobitPin(DigitalPin.P2);
    const C16: PwmPin = new MicrobitPin(DigitalPin.C16);
    const C17: PwmPin = new MicrobitPin(DigitalPin.C17);

    //% fixedInstance block="P1"
    //% group="Touch"
    export const touchP1 = new CapacitiveButton(CAPACITIVE_TOUCH_ID + DAL.MICROBIT_ID_IO_P0, P1);
    //% fixedInstance block="P2"
    //% group="Touch"
    export const touchP2 = new CapacitiveButton(CAPACITIVE_TOUCH_ID + DAL.MICROBIT_ID_IO_P1, P2);
    //% fixedInstance block="C16"
    //% group="Touch"
    export const touchC16 = new CapacitiveButton(CAPACITIVE_TOUCH_ID + DAL.MICROBIT_ID_IO_P2, C16);
    //% fixedInstance block="C17"
    //% group="Touch"
    export const touchC17 = new CapacitiveButton(CAPACITIVE_TOUCH_ID + DAL.MICROBIT_ID_IO_P8, C17);
}
