// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

export default CodeMirror => {
  "use strict";

  CodeMirror.overlayMode = function (base, overlay, combine) {
    return {
      startState: function () {
        return {
          base: CodeMirror.startState(base),
          overlay: CodeMirror.startState(overlay),
          basePos: 0,
          baseCur: null,
          overlayPos: 0,
          overlayCur: null,
          streamSeen: null
        };
      },
      copyState: function (state) {
        return {
          base: CodeMirror.copyState(base, state.base),
          overlay: CodeMirror.copyState(overlay, state.overlay),
          basePos: state.basePos,
          baseCur: null,
          overlayPos: state.overlayPos,
          overlayCur: null
        };
      },

      token: function (stream, state) {
        if (stream != state.streamSeen ||
          Math.min(state.basePos, state.overlayPos) < stream.start) {
          state.streamSeen = stream;
          state.basePos = state.overlayPos = stream.start;
        }

        if (stream.start == state.basePos) {
          state.baseCur = base.token(stream, state.base);
          state.basePos = stream.pos;
        }
        if (stream.start == state.overlayPos) {
          stream.pos = stream.start;
          state.overlayCur = overlay.token(stream, state.overlay);
          state.overlayPos = stream.pos;
        }
        stream.pos = Math.min(state.basePos, state.overlayPos);

        // state.overlay.combineTokens always takes precedence over combine,
        // unless set to null
        if (state.overlayCur == null) return state.baseCur;
        else if (state.baseCur != null &&
          state.overlay.combineTokens ||
          combine && state.overlay.combineTokens == null)
          return state.baseCur + " " + state.overlayCur;
        else return state.overlayCur;
      },

      indent: base.indent && function (state, textAfter) {
        return base.indent(state.base, textAfter);
      },
      electricChars: base.electricChars,

      innerMode: function (state) {
        return {
          state: state.base,
          mode: base
        };
      },

      blankLine: function (state) {
        var baseToken, overlayToken;
        if (base.blankLine) baseToken = base.blankLine(state.base);
        if (overlay.blankLine) overlayToken = overlay.blankLine(state.overlay);

        return overlayToken == null ?
          baseToken :
          (combine && baseToken != null ? baseToken + " " + overlayToken : overlayToken);
      }
    };
  };

}
