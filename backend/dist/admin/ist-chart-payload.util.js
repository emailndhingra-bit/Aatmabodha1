"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chartPayloadFromProfileFields = chartPayloadFromProfileFields;
function chartPayloadFromProfileFields(input) {
    const tzVal = input.timezone != null && Number.isFinite(Number(input.timezone)) ? Number(input.timezone) : 5.5;
    const dobVal = input.dateOfBirth;
    const tobVal = input.timeOfBirth;
    const [year, month, day] = dobVal.split('-').map(Number);
    const [hour, minute] = tobVal.split(':').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const offsetMs = tzVal * 60 * 60 * 1000;
    const trueUtcTime = utcDate.getTime() - offsetMs;
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istTime = trueUtcTime + istOffsetMs;
    const istDate = new Date(istTime);
    const istDob = istDate.toISOString().split('T')[0];
    const istTob = istDate.toISOString().split('T')[1].substring(0, 5);
    return {
        date_of_birth: istDob,
        time_of_birth: istTob,
        latitude: input.latitude,
        longitude: input.longitude,
        timezone: tzVal,
    };
}
//# sourceMappingURL=ist-chart-payload.util.js.map