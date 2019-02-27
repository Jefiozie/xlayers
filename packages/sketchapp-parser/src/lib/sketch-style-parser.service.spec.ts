import { async, TestBed } from '@angular/core/testing';
import { SketchStyleParserService, BorderType } from './sketch-style-parser.service';
import { getSketchColorMock } from './sketch-style-parser.service.mock';

fdescribe('SketchStyleParserService', () => {
  let sketchStyleParserService: SketchStyleParserService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [SketchStyleParserService]
    });
  }));

  beforeEach(() => {
    sketchStyleParserService = TestBed.get(SketchStyleParserService);
  });

  it('should create', () => {
    expect(sketchStyleParserService).toBeTruthy();
  });

  describe('when parse text', () => {
    it('should parse text font', () => {
      const obj = {
        style: {
          textStyle: {
            encodedAttributes: {
              MSAttributedStringFontAttribute: {
                _class: 'fontDescriptor',
                attributes: {
                  name: 'Roboto-Medium',
                  size: 14
                }
              }
            }
          }
        }
      } as any;
      expect(sketchStyleParserService.transformTextFont(obj)).toEqual({
        'font-family': '\'Roboto-Medium\', \'Roboto\', \'sans-serif\'',
        'font-size': '14px',
      });
    });

    it('should not parse not configured font', () => {
      const obj = {
        style: {
          textStyle: {
            encodedAttributes: {
              MSAttributedStringFontAttribute: {
              }
            }
          }
        }
      } as SketchMSLayer;
      expect(sketchStyleParserService.transformTextFont(obj)).toEqual({});
    });

    it('should parse color', () => {
      const obj = {
        style: {
          textStyle: {
            encodedAttributes: {
              MSAttributedStringColorAttribute: {
                alpha: 0.4,
                blue: 0.65,
                green: 0.321,
                red: 1
              }
            }
          }
        }
      } as SketchMSLayer;
      expect(sketchStyleParserService.transformTextColor(obj)).toEqual({
        color: 'rgba(255,82,166,0.4)'
      });
    });

    it('should fallback to black for unknow color', () => {
      const obj = {
        style: {
          textStyle: {
            encodedAttributes: {}
          }
        }
      } as SketchMSLayer;
      expect(sketchStyleParserService.transformTextColor(obj)).toEqual({
        color: 'black'
      });
    });
  });

  describe('when parse color', () => {
    it('should parse', () => {
      const color = {
        red: 0.53,
        green: 0.32,
        blue: 0.13,
        alpha: 1,
      } as SketchMSColor;
      const result = sketchStyleParserService.parseColors(color);
      expect(result.hex).toBe('#875221ff');
      expect(result.rgba).toBe('rgba(135,82,33,1)');
      expect(result.raw).toEqual({
        red: 135,
        green: 82,
        blue: 33,
        alpha: 1
      });
    });

    it('should fallback for unvalid color', () => {
      const color = {
        red: 0.94,
        green: -0.12,
        blue: 0.233,
        alpha: 0.3,
      } as SketchMSColor;
      const result = sketchStyleParserService.parseColors(color);
      expect(result.hex).toBe('#f0003b4d');
      expect(result.rgba).toBe('rgba(240,0,59,0.3)');
      expect(result.raw).toEqual({
        red: 240,
        green: 0,
        blue: 59,
        alpha: 0.3
      });
    });
  });

  it('should set style', () => {
    const color = getSketchColorMock();
    const obj = { css: {} };
    const root = {};
    sketchStyleParserService.setStyle(obj, root, { 'background-color': color.toString() });
    expect(obj).toEqual({ css: { 'background-color': color.toString() } });
    expect(root).toEqual({ css: { 'background-color': color.toString() } });
  });

  it('should parse shadow', () => {
    const obj = {
      shadows: [{
        offsetX: 123,
        offsetY: 53,
        blurRadius: 12,
        spread: 23,
        color: getSketchColorMock()
      }]
    } as SketchMSStyle;
    const color = sketchStyleParserService['parseColors'](obj.shadows[0].color);
    expect(sketchStyleParserService.transformShadows(obj)).toEqual({ 'box-shadow': `123px 53px 12px 23px ${color.rgba}` });
  });

  describe('when parse blur', () => {
    it('should parse positive radius blur', () => {
      const obj = { blur: { radius: 96 } } as SketchMSStyle;
      expect(sketchStyleParserService.transformBlur(obj)).toEqual({ filter: `blur(${obj.blur.radius}px);` });
    });

    it('should skip for negative blur radius', () => {
      const obj = { blur: { radius: -123 } } as SketchMSStyle;
      expect(sketchStyleParserService.transformBlur(obj)).toEqual({});
    });

    it('should skip for 0 blur radius', () => {
      const obj = { blur: { radius: 0 } } as SketchMSStyle;
      expect(sketchStyleParserService.transformBlur(obj)).toEqual({});
    });

    it('should skip on undefined blur', () => {
      const obj = {} as SketchMSStyle;
      expect(sketchStyleParserService.transformBlur(obj)).toEqual({});
    });
  });

  describe('when parse border', () => {
    it('should parse border', () => {
      const obj = {
        borders: [{
          thickness: 129,
          position: BorderType.CENTER,
          color: getSketchColorMock()
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.borders[0].color);
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({ 'box-shadow': `0 0 0 129px ${color.rgba}` });
    });

    it('should skip for negative thickness border', () => {
      const obj = {
        borders: [{
          thickness: -38,
          position: BorderType.CENTER,
          color: getSketchColorMock()
        }]
      } as SketchMSStyle;
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({});
    });

    it('should set inet for boder type inside', () => {
      const obj = {
        borders: [{
          thickness: 129,
          position: BorderType.INSIDE,
          color: getSketchColorMock()
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.borders[0].color);
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({ 'box-shadow': `0 0 0 129px ${color.rgba} inset` });
    });

    it('should skip fallback to default on center position', () => {
      const obj = {
        borders: [{
          thickness: 129,
          position: BorderType.CENTER,
          color: getSketchColorMock()
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.borders[0].color);
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({ 'box-shadow': `0 0 0 129px ${color.rgba}` });
    });

    it('should skip fallback to default on outside position', () => {
      const obj = {
        borders: [{
          thickness: 129,
          position: BorderType.OUTSIDE,
          color: getSketchColorMock()
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.borders[0].color);
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({ 'box-shadow': `0 0 0 129px ${color.rgba}` });
    });

    it('should skip on empty border', () => {
      const obj = { borders: [] } as SketchMSStyle;
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({});
    });

    it('should skip on undefined border', () => {
      const obj = {} as SketchMSStyle;
      expect(sketchStyleParserService.transformBorders(obj)).toEqual({});
    });
  });

  describe('when parse fill', () => {
    it('should parse fill', () => {
      const obj = {
        fills: [{
          color: getSketchColorMock(),
          gradient: {
            stops: [{
              color: getSketchColorMock(),
              position: 0.835923120242395
            }]
          }
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.fills[0].color);
      const colorStop = sketchStyleParserService['parseColors'](obj.fills[0].gradient.stops[0].color);
      expect(sketchStyleParserService.transformFills(obj)).toEqual({
        'background-color': color.rgba,
        'background': `linear-gradient(90deg, ${colorStop.rgba} 83.5923120242395%)`
      });
    });

    it('should fallback for unvalid position fill', () => {
      const obj = {
        fills: [{
          color: getSketchColorMock(),
          gradient: {
            stops: [{
              color: getSketchColorMock(),
              position: 154
            }]
          }
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.fills[0].color);
      const colorStop = sketchStyleParserService['parseColors'](obj.fills[0].gradient.stops[0].color);
      expect(sketchStyleParserService.transformFills(obj)).toEqual({
        'background-color': color.rgba,
        'background': `linear-gradient(90deg, ${colorStop.rgba})`
      });
    });

    it('should fallback for negative position fill', () => {
      const obj = {
        fills: [{
          color: getSketchColorMock(),
          gradient: {
            stops: [{
              color: getSketchColorMock(),
              position: -0.123125345387423
            }]
          }
        }]
      } as SketchMSStyle;
      const color = sketchStyleParserService['parseColors'](obj.fills[0].color);
      const colorStop = sketchStyleParserService['parseColors'](obj.fills[0].gradient.stops[0].color);
      expect(sketchStyleParserService.transformFills(obj)).toEqual({
        'background-color': color.rgba,
        'background': `linear-gradient(90deg, ${colorStop.rgba})`
      });
    });
  });

  describe('when ast is parsed it should unduplicate', () => {


    it('should eliminate all duplicate css', () => {

      const arrayOfStyles = [':host {\n  display: block;\n  position: relative;\n}\n',
        '.xly_0aqp {\n  display: block;\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  width: 344px;\n  height: 208px;\n  visibility: visible;\n}',
        '.xly_2oag {\n  border-radius: 3px;\n  display: block;\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  width: 344px;\n  height: 208px;\n  visibility: visible;\n  box-shadow: 0px 2px 2px 0px rgba(0,0,0,0.24),0px 0px 2px 0px rgba(0,0,0,0.12);\n  background-color: rgba(250,250,250,1);\n  opacity: 1;\n}',
      '.xly_6p1h {\n  color: rgba(0,150,136,1);\n  font-family: \'Roboto-Regular\', \'Roboto\', \'sans-serif\';\n  font-size: 24px;\n  display: block;\n  position: absolute;\n  left: 18px;\n  top: 22px;\n  width: 166px;\n  height: 32px;\n  visibility: visible;\n}',
      '.xly_nnjs {\n  color: rgba(0,0,0,0.87);\n  font-family: \'Roboto-Regular\', \'Roboto\', \'sans-serif\';\n  font-size: 16px;\n  display: block;\n  position: absolute;\n  left: 19px;\n  top: 61px;\n  width: 204px;\n  height: 48px;\n  visibility: visible;\n}',
      '.xly_1f2l {\n  display: block;\n  position: absolute;\n  left: 77px;\n  top: 165px;\n  width: 54px;\n  height: 36px;\n  visibility: visible;\n}',
      '.xly_kxmb {\n  display: block;\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  width: 54px;\n  height: 36px;\n  visibility: visible;\n  opacity: 0.5;\n}',
      '.xly_aaxa {\n  color: rgba(0,150,136,1);\n  font-family: \'Roboto-Medium\', \'Roboto\', \'sans-serif\';\n  font-size: 14px;\n  display: block;\n  position: absolute;\n  left: 14.5px;\n  top: 10px;\n  width: 26px;\n  height: 38px;\n  visibility: visible;\n}',
      '.xly_tj9b {\n  display: block;\n  position: absolute;\n  left: 8px;\n  top: 165px;\n  width: 68px;\n  height: 36px;\n  visibility: visible;\n}',
      '.xly_ysqv {\n  display: block;\n  position: absolute;\n  left: 0px;\n  top: 0px;\n  width: 68px;\n  height: 36px;\n  visibility: visible;\n  opacity: 0.5;\n}',
      '.xly_weot {\n  color: rgba(0,150,136,1);\n  font-family: \'Roboto-Medium\', \'Roboto\', \'sans-serif\';\n  font-size: 14px;\n  display: block;\n  position: absolute;\n  left: 24.5px;\n  top: 10px;\n  width: 20px;\n  height: 16px;\n  visibility: visible;\n}',
      '.xly_wa4a {\n  display: block;\n  position: absolute;\n  left: 0px;\n  top: 154px;\n  width: 344px;\n  height: 3px;\n  visibility: visible;\n  box-shadow: 0 0 0 1px rgba(0,0,0,0.12);\n}']'"'

      const css = {
        display: `block`,
        position: `absolute`,
        left: `0px`,
        top: `0px`,
        width: `344px`,
        height: `208px`,
        visibility: `visible`
      };
      const data = {
        layers: [
          {
            name: 'a',
            css
          }, {
            name: 'b',
            css
          }
        ]
      };


      const act = sketchStyleParserService.findDuplications(data);
      const result = {
        layers: [
          {
            name: 'a',
            css
          }, {
            name: 'b'
          }
        ]
      };
      expect(data).toEqual(result);
    });
  });
});
