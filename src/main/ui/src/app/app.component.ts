import {HttpClient, HttpParams} from '@angular/common/http';
import {Component, ViewChild, AfterViewInit} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import { Page } from 'ngx-pagination/dist/pagination-controls.directive';
import {merge, Observable, of as observableOf} from 'rxjs';
import {catchError, map, startWith, switchMap} from 'rxjs/operators';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent  {
  chartData: any = [];
  xAxisLabel: string = '';
  yAxisLabel: string = '';
  legendTitle: string = '';

  displayedColumns: string[] = ['time', 'latitude', 'longitude', 'depth', 'mag', 'magType'];
  exampleDatabase: ExampleHttpDatabase | null;
  data: EarthQuake[] = [];
  queryStatistics: Statistics[] = [];
  filterId: number = 0;

  private url: string = '/earthquake?';

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(private _httpClient: HttpClient) {}

  element: string = '_embedded.earthquake';

  ngAfterViewInit() {
    this.getCountByMag().subscribe(data => {
      this.chartData = data;
      this.xAxisLabel = 'Magnitude';
        this.yAxisLabel = 'no of EarthQuakes';
        this.legendTitle = 'By Magnitude Chart';
  });
    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient, this.url);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.exampleDatabase!.getEarthQuakeContent(
            this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.earthQuakes.totalElements;
          this.queryStatistics = data.queryStatistics;

          return data.earthQuakes.content;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          // Catch if the  API has reached its rate limit. Return empty data.
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(data => this.data = data);
  }

  onSelected(filterId: number): void {
    console.log(`not yet implemented` + filterId);
    this.filterId = filterId;
    if(0==filterId){
      this.url = '/earthquake?';
      this.queryStatistics = [];
      this.ngAfterViewInit();
    }
  }
  magGreater(mag: number): void {
    this.url = `/earthquake/findByMagGreaterThanEqual?mag=${mag}&`;
    this.exampleDatabase = null;
    this.data = [];
    this.queryStatistics = [];
    this.ngAfterViewInit();
  }
  magAndTime(minMag: string, maxMag:string, minTime:string, maxTime:string): void {
    this.url = `/earthquake/findByMagBetweenAndAndTimeBetween?startMag=${minMag}&endMag=${maxMag}&startDate=${minTime}T00:00:00.000Z&endDate=${maxTime}T00:00:00.000Z&`;
    this.exampleDatabase = null;
    this.data = [];
    this.queryStatistics = [];
    this.ngAfterViewInit();
  }

  distanceFrom(latitude:string, longitude:string, distance:string): void {
    this.url = `/earthquake/findEarthQuakesByDistance?latitude=${latitude}&longitude=${longitude}&distance=${distance}&`;
    this.exampleDatabase = null;
    this.data = [];
    this.queryStatistics = [];
    this.paginator.pageIndex = 0;

    this.exampleDatabase = new ExampleHttpDatabase(this._httpClient, this.url);

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.exampleDatabase!.getEarthQuakeContent(
            this.sort.active, this.sort.direction, this.paginator.pageIndex);
        }),
        map(data => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.isRateLimitReached = false;
          this.resultsLength = data.earthQuakes.totalElements;
          this.queryStatistics = data.queryStatistics;

          return data.earthQuakes.content;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          // Catch if the  API has reached its rate limit. Return empty data.
          this.isRateLimitReached = true;
          return observableOf([]);
        })
      ).subscribe(data => this.data = data);
  }

  myForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });

  myForm2 = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    file: new FormControl('', [Validators.required]),
    fileSource: new FormControl('', [Validators.required])
  });

  get f(){
    return this.myForm.controls;
  }

  onFileChange(event) {

    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      this.myForm.patchValue({
        fileSource: file
      });
    }
  }

  submit(message: string){
    const formData = new FormData();
    formData.append('file', this.myForm.get('fileSource').value);
    formData.append('message', message);

    this.exampleDatabase.downloadFile(formData)
      .subscribe(res => {
        console.log(this.myForm.get('fileSource').value.name);
        const fileName = this.myForm.get('fileSource').value.name;
        saveAs(new Blob([res], {type: 'application/text'}), fileName.substring(0, fileName.indexOf('.txt')) + 'WithHiddenMsg.txt');
      })
  }

  retrieveMessage(){
    const formData = new FormData();
    formData.append('file', this.myForm.get('fileSource').value);

    this.exampleDatabase.retrieveSecretMessage(formData)
      .subscribe(res => {
        alert('Secret Message : ' + res);
      })
  }
  getCountByMag(){
    const requestUrl = 'earthquake/countByMag';
    return this._httpClient.get(requestUrl);
  }
  getCountByLocation(){
    const requestUrl = 'earthquake/countByLocationSource';
    return this._httpClient.get(requestUrl);
  }
  getCountByTime(){
    const requestUrl = 'earthquake/countByTime';
    return this._httpClient.get(requestUrl);
  }
  onSelectChartData(filterId: number){
    if(0==filterId){
      this.getCountByMag().subscribe(data => {
        this.chartData = data;
        this.xAxisLabel = 'Magnitude';
        this.yAxisLabel = 'no of EarthQuakes';
        this.legendTitle = 'By Magnitude Chart';
      });
    }else if(1==filterId){
      this.getCountByLocation().subscribe(data => {
        this.chartData = data;
        this.xAxisLabel = 'Location Source';
        this.yAxisLabel = 'no of EarthQuakes';
        this.legendTitle = 'By Location Source Chart';
      });
    }else if(2==filterId){
      this.getCountByTime().subscribe(data => {
        this.chartData = data;
        this.xAxisLabel = 'Location Source';
        this.yAxisLabel = 'no of EarthQuakes';
        this.legendTitle = 'By Location Source Chart';
      });
    }
  }
  onSelectChartType(filterId: number){
    this.chartType = filterId;
  }
  chartType: number=0

}

export interface EarthQuakeAPI{
  _embedded: EarthQuakeArray;
  page: PageDtl;
}
export interface EarthQuakeArray{
  earthquake: EarthQuake[];
  queryStatistics: Statistics[];
}

export interface Statistics{
  query: String;
  executionTime: number;
}

export interface PageDtl{
  size: number;
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface EarthQuake{
  time: string;
  latitude: number;
  longitude: number;
  depth: number;
  mag?: number;
  magType: string;
  nst: number;
  gap: number;
  dmin: number;
  rms: number;
  net?: string;
  id?: string;
  updated: string;
  place: string;
  type: string;
  horizontalError: number;
  depthError: number;
  magError: number;
  magNst: string;
  status: string;
  locationSource: string;
  magSource: string;
}

export interface EarthQuakeContent {
  earthQuakes: EarthQuakeBody;
  queryStatistics: Statistics[];
}

export interface EarthQuakeBody extends PageDtl{
  content: EarthQuake[];
}

export interface ChartData{
  name: string;
  value: number;
}

export interface ChartArray{
  chartArray: ChartData[];
}

export class ExampleHttpDatabase {
  constructor(private _httpClient: HttpClient, private href: string) {}

  getEarthQuakeDetails(sort: string, order: string, page: number): Observable<EarthQuakeAPI> {
    //const href = 'http://localhost:808/earthquake';
    const requestUrl =
        `${this.href}sort=${sort},${order}&page=${page}`;

    return this._httpClient.get<EarthQuakeAPI>(requestUrl);
  }

  getEarthQuakeContent(sort: string, order: string, page: number): Observable<EarthQuakeContent> {
    const requestUrl =
        `${this.href}sort=${sort},${order}&page=${page}`;

    return this._httpClient.get<EarthQuakeContent>(requestUrl);
  }

  downloadFile(formData: FormData) {
    return this._httpClient.post('steganography/uploadFile', formData, {
      responseType: 'arraybuffer'
    });
  }

  retrieveSecretMessage(formData: FormData) {
    return this._httpClient.post('steganography/retrieveMessage', formData);
  }

}
