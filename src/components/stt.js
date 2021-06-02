
export const Resampler = /*#__PURE__*/function () {
    function Resampler(fromSampleRate, toSampleRate, channels, inputBufferSize) {
      if (!fromSampleRate || !toSampleRate || !channels) {
        throw new Error("Invalid settings specified for the resampler.");
      }
  
      this.resampler = null;
      this.fromSampleRate = fromSampleRate;
      this.toSampleRate = toSampleRate;
      this.channels = channels || 0;
      this.inputBufferSize = inputBufferSize;
      this.initialize();
    }
  
    var _proto = Resampler.prototype;
  
    _proto.initialize = function initialize() {
      if (this.fromSampleRate == this.toSampleRate) {
        // Setup resampler bypass - Resampler just returns what was passed through
        this.resampler = function (buffer) {
          return buffer;
        };
  
        this.ratioWeight = 1;
      } else {
        if (this.fromSampleRate < this.toSampleRate) {
          // Use generic linear interpolation if upsampling,
          // as linear interpolation produces a gradient that we want
          // and works fine with two input sample points per output in this case.
          this.linearInterpolation();
          this.lastWeight = 1;
        } else {
          // Custom resampler I wrote that doesn't skip samples
          // like standard linear interpolation in high downsampling.
          // This is more accurate than linear interpolation on downsampling.
          this.multiTap();
          this.tailExists = false;
          this.lastWeight = 0;
        } // Initialize the internal buffer:
  
  
        this.initializeBuffers();
        this.ratioWeight = this.fromSampleRate / this.toSampleRate;
      }
    };
  
    _proto.bufferSlice = function bufferSlice(sliceAmount) {
      //Typed array and normal array buffer section referencing:
      try {
        return this.outputBuffer.subarray(0, sliceAmount);
      } catch (error) {
        try {
          //Regular array pass:
          this.outputBuffer.length = sliceAmount;
          return this.outputBuffer;
        } catch (error) {
          //Nightly Firefox 4 used to have the subarray function named as slice:
          return this.outputBuffer.slice(0, sliceAmount);
        }
      }
    };
  
    _proto.initializeBuffers = function initializeBuffers() {
      this.outputBufferSize = Math.ceil(this.inputBufferSize * this.toSampleRate / this.fromSampleRate / this.channels * 1.000000476837158203125) + this.channels + this.channels;
  
      try {
        this.outputBuffer = new Float32Array(this.outputBufferSize);
        this.lastOutput = new Float32Array(this.channels);
      } catch (error) {
        this.outputBuffer = [];
        this.lastOutput = [];
      }
    };
  
    _proto.linearInterpolation = function linearInterpolation() {
      var _this = this;
  
      this.resampler = function (buffer) {
        var bufferLength = buffer.length,
            channels = _this.channels,
            outLength,
            ratioWeight,
            weight,
            firstWeight,
            secondWeight,
            sourceOffset,
            outputOffset,
            outputBuffer,
            channel;
  
        if (bufferLength % channels !== 0) {
          throw new Error("Buffer was of incorrect sample length.");
        }
  
        if (bufferLength <= 0) {
          return [];
        }
  
        outLength = _this.outputBufferSize;
        ratioWeight = _this.ratioWeight;
        weight = _this.lastWeight;
        firstWeight = 0;
        secondWeight = 0;
        sourceOffset = 0;
        outputOffset = 0;
        outputBuffer = _this.outputBuffer;
  
        for (; weight < 1; weight += ratioWeight) {
          secondWeight = weight % 1;
          firstWeight = 1 - secondWeight;
          _this.lastWeight = weight % 1;
  
          for (channel = 0; channel < _this.channels; ++channel) {
            outputBuffer[outputOffset++] = _this.lastOutput[channel] * firstWeight + buffer[channel] * secondWeight;
          }
        }
  
        weight -= 1;
  
        for (bufferLength -= channels, sourceOffset = Math.floor(weight) * channels; outputOffset < outLength && sourceOffset < bufferLength;) {
          secondWeight = weight % 1;
          firstWeight = 1 - secondWeight;
  
          for (channel = 0; channel < _this.channels; ++channel) {
            outputBuffer[outputOffset++] = buffer[sourceOffset + (channel > 0 ? channel : 0)] * firstWeight + buffer[sourceOffset + (channels + channel)] * secondWeight;
          }
  
          weight += ratioWeight;
          sourceOffset = Math.floor(weight) * channels;
        }
  
        for (channel = 0; channel < channels; ++channel) {
          _this.lastOutput[channel] = buffer[sourceOffset++];
        }
  
        return _this.bufferSlice(outputOffset);
      };
    };
  
    _proto.multiTap = function multiTap() {
      var _this2 = this;
  
      this.resampler = function (buffer) {
        var bufferLength = buffer.length,
            outLength,
            output_variable_list,
            channels = _this2.channels,
            ratioWeight,
            weight,
            channel,
            actualPosition,
            amountToNext,
            alreadyProcessedTail,
            outputBuffer,
            outputOffset,
            currentPosition;
  
        if (bufferLength % channels !== 0) {
          throw new Error("Buffer was of incorrect sample length.");
        }
  
        if (bufferLength <= 0) {
          return [];
        }
  
        outLength = _this2.outputBufferSize;
        output_variable_list = [];
        ratioWeight = _this2.ratioWeight;
        weight = 0;
        actualPosition = 0;
        amountToNext = 0;
        alreadyProcessedTail = !_this2.tailExists;
        _this2.tailExists = false;
        outputBuffer = _this2.outputBuffer;
        outputOffset = 0;
        currentPosition = 0;
  
        for (channel = 0; channel < channels; ++channel) {
          output_variable_list[channel] = 0;
        }
  
        do {
          if (alreadyProcessedTail) {
            weight = ratioWeight;
  
            for (channel = 0; channel < channels; ++channel) {
              output_variable_list[channel] = 0;
            }
          } else {
            weight = _this2.lastWeight;
  
            for (channel = 0; channel < channels; ++channel) {
              output_variable_list[channel] = _this2.lastOutput[channel];
            }
  
            alreadyProcessedTail = true;
          }
  
          while (weight > 0 && actualPosition < bufferLength) {
            amountToNext = 1 + actualPosition - currentPosition;
  
            if (weight >= amountToNext) {
              for (channel = 0; channel < channels; ++channel) {
                output_variable_list[channel] += buffer[actualPosition++] * amountToNext;
              }
  
              currentPosition = actualPosition;
              weight -= amountToNext;
            } else {
              for (channel = 0; channel < channels; ++channel) {
                output_variable_list[channel] += buffer[actualPosition + (channel > 0 ? channel : 0)] * weight;
              }
  
              currentPosition += weight;
              weight = 0;
              break;
            }
          }
  
          if (weight === 0) {
            for (channel = 0; channel < channels; ++channel) {
              outputBuffer[outputOffset++] = output_variable_list[channel] / ratioWeight;
            }
          } else {
            _this2.lastWeight = weight;
  
            for (channel = 0; channel < channels; ++channel) {
              _this2.lastOutput[channel] = output_variable_list[channel];
            }
  
            _this2.tailExists = true;
            break;
          }
        } while (actualPosition < bufferLength && outputOffset < outLength);
  
        return _this2.bufferSlice(outputOffset);
      };
    };
  
    _proto.resample = function resample(buffer) {
      if (this.fromSampleRate == this.toSampleRate) {
        this.ratioWeight = 1;
      } else {
        if (this.fromSampleRate < this.toSampleRate) {
          this.lastWeight = 1;
        } else {
          this.tailExists = false;
          this.lastWeight = 0;
        }
  
        this.initializeBuffers();
        this.ratioWeight = this.fromSampleRate / this.toSampleRate;
      }
  
      return this.resampler(buffer);
    };
  
    return Resampler;
  }();

  export function floatTo16BitPCM(input) {
    let i      = input.length;
    let output = new Int16Array(i);
    while (i--) {
      let s     = Math.max(-1, Math.min(1, input[i]));
      output[i] = (s < 0 ? s * 0x8000 : s * 0x7FFF);
    }
    return output;
  }
        