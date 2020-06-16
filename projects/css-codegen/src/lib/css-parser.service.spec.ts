import { TestBed } from '@angular/core/testing';
import { CssParserService } from './css-parser.service';

describe('CssParserService', () => {
    let service: CssParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [CssParserService]
        });

        service = TestBed.inject(CssParserService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });
});
